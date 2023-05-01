import dotenv from 'dotenv';
dotenv.config();
import User from '../models/user_model.js';
import Post from '../models/post_model.js';
import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Cache from '../../util/cache.js';
import { getPostUserStatus } from './post_controller.js';

const signup = async (req, res) => {
    const { name, email, password, location_pre, type_pre } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }

    const isUser = await User.userExist(email);
    if (isUser) {
        return res.status(400).json({ error: 'User already exists.' });
    }
    const hash = await bcrypt.hash(password, 10);
    let locationPre = {};
    for (let i = 0; i < 7; i++) {
        locationPre[location_pre[i]] = Number((1.6 - i * 0.2).toFixed(1));
    }
    let typePre = {};
    for (let i = 0; i < 7; i++) {
        typePre[type_pre[i]] = Number((1.6 - i * 0.2).toFixed(1));
    }
    const user = await User.signup(name, email, hash, locationPre, typePre, 'native');
    const accessToken = jwt.sign(
        {
            provider: user.provider,
            name: user.name,
            email: user.email,
            id: user._id,
        },
        process.env.TOKEN_SECRET
    );
    console.log(`New user ${user._id} signed up`);
    res.status(200).json({ data: { user, accessToken } });
};

const signin = async (req, res) => {
    const { email, password } = req.body;
    const isUser = await User.userExist(email);
    if (!isUser) {
        return res.status(400).json({ error: 'User not exists.' });
    }
    const user = await User.getUser(email);
    if (!user) {
        console.log("E-mail doesn't exist.");
        return res.status(400).json({ error: "E-mail doesn't exist." });
    }
    const hash = user.password;
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
        return res.status(403).json({
            errors: 'Password is not valid.',
        });
    }

    const accessToken = jwt.sign(
        {
            provider: user.provider,
            name: user.name,
            email: user.email,
            id: user._id,
        },
        process.env.TOKEN_SECRET
    );
    return res.status(200).json({ data: { user, accessToken } });
};

const checkEmail = async (req, res) => {
    const { email } = req.body;
    const isUser = await User.userExist(email);
    if (isUser !== null) {
        return res.status(400).json({ error: 'User already exists.' });
    }
    res.status(200).json({ message: 'pass' });
};

const logout = async (req, res) => {
    const userId = req.user.id;
    const { logoutTime } = req.body;
    await User.logout(userId, logoutTime);
    console.log(`User ${userId} logged out.`);
    res.status(200).json({ message: `User ${userId} logged out.` });
};

const getUserData = async (req, res) => {
    const userId = req.user.id;
    const user = await User.queryUser(userId);
    const { name, email, location_pre, type_pre, image, notification } = user;
    let location = Object.entries(location_pre).sort((a, b) => b[1] - a[1]);
    location = location.map((l) => {
        return l[0];
    });
    let type = Object.entries(type_pre).sort((a, b) => b[1] - a[1]);
    type = type.map((t) => {
        return t[0];
    });
    const userData = {
        userId,
        name,
        email,
        location,
        type,
        image,
        notification,
    };
    return res.status(200).json({ data: userData });
};

const editUserSetting = async (req, res) => {
    const userId = req.user.id;
    const { name, email, image, location_pre, type_pre } = req.body;
    let locationPre = {};
    for (let i = 0; i < location_pre.length; i++) {
        locationPre[location_pre[i]] = Number((1.6 - i * 0.2).toFixed(1));
    }
    let typePre = {};
    for (let i = 0; i < type_pre.length; i++) {
        typePre[type_pre[i]] = Number((1.6 - i * 0.2).toFixed(1));
    }
    await User.updateUserSetting(userId, name, email, image, locationPre, typePre);
    return res.status(200).json({ message: `User ${userId} setting updated.` });
};

const generateUserNewsfeed = async (req, res) => {
    const userId = req.user.id;
    const user = await User.queryUser(userId);
    const locationScoreSum = Object.values(user.location_score).reduce(
        (acc, score) => acc + score,
        0
    );
    const catScoreSum = Object.values(user.type_score).reduce((acc, score) => acc + score, 0);

    // 把每個類別的分數除以加總獲得比例*user自己預設的喜好排序
    let locationScore = {};
    for (const [key, value] of Object.entries(user.location_score)) {
        const score = user.location_pre[key] * (value / locationScoreSum);
        locationScore[key] = score;
    }
    let catScore = {};
    for (const [key, value] of Object.entries(user.type_score)) {
        const score = user.type_pre[key] * (value / catScoreSum);
        catScore[key] = score;
    }

    // 取出TOP1000篇文章
    const posts = await Cache.zrevrange('top-posts', 0, 999, 'WITHSCORES');
    const newsFeed = [];
    for (let i = 0; i < posts.length; i++) {
        if (!(i % 2)) {
            newsFeed.push({ post: posts[i] });
        } else {
            const location = JSON.parse(newsFeed[Math.floor(i / 2)].post).location.continent;
            const cat = JSON.parse(newsFeed[Math.floor(i / 2)].post).type;
            // TOP文章分數*user對該location分數*user對該category分數
            newsFeed[Math.floor(i / 2)].score =
                Number(posts[i]) * locationScore[location] * catScore[cat];
        }
    }

    // 丟進Redis sorted set
    await Cache.del(userId);
    await Cache.zadd(
        `user:${userId}`,
        ...newsFeed.map(({ post, score }) => [Math.round(score * 1000000) / 1000, post])
    );
    await Cache.expire(userId, 86400);
    res.status(200).json({ message: `User ${userId} newsfeed cached.` });
};

const getUserPosts = async (req, res) => {
    const userId = req.params.id;
    const posts = await User.queryUserPosts(userId);
    if (posts.error) {
        return res.status(400).json({ message: "Can't find user's post." });
    }
    res.status(200).json({ data: posts });
};

const getUserVisited = async (req, res) => {
    const userId = req.user.id;
    const visitedISO3 = await User.queryUserVisited(userId);
    if (visitedISO3.error) {
        return res.status(400).json({ message: "Can't find user's visited countries." });
    }
    res.status(200).json({ data: visitedISO3 });
};

const getUserSavedPosts = async (req, res) => {
    const { postIds } = req.body;
    const posts = await Post.queryPostsByIds(postIds);
    res.status(200).json({ data: posts });
};
const getUserNotification = async (req, res) => {
    const userId = req.user.id;
    const notification = await User.getNotification(userId);
    res.status(200).json({ data: notification });
};

const readUserNotification = async (req, res) => {
    const userId = req.user.id;
    await User.readNotification(userId);
    res.status(200).json({ message: `${userId} read notifications.` });
};
export {
    signup,
    signin,
    logout,
    checkEmail,
    getUserData,
    editUserSetting,
    generateUserNewsfeed,
    getUserPosts,
    getUserVisited,
    getUserSavedPosts,
    getUserNotification,
    readUserNotification,
};
