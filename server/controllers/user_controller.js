import User from '../models/user_model.js';
import Post from '../models/post_model.js';
import validator from 'validator';
import bcrypt from 'bcrypt';
import Cache from '../../util/cache.js';
import { signJwt } from '../../util/util.js';
import { cacheUserNewsfeed } from '../../util/cacheUserNewsfeed.js';
import {
    Locations,
    Types,
    MaxUserPreferenceScore,
    UserPreferenceScoreDiff,
} from '../../constants.js';
import dotenv from 'dotenv';
dotenv.config();

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
    const hash = await bcrypt.hash(password, Number(process.env.PWD_SALT_ROUNDS));

    let locationPre = {};
    for (let i = 0; i < Locations.length; i++) {
        locationPre[location_pre[i]] = Number(
            (MaxUserPreferenceScore - i * UserPreferenceScoreDiff).toFixed(1)
        );
    }
    let typePre = {};
    for (let i = 0; i < Types.length; i++) {
        typePre[type_pre[i]] = Number(
            (MaxUserPreferenceScore - i * UserPreferenceScoreDiff).toFixed(1)
        );
    }

    const user = await User.signup(name, email, hash, locationPre, typePre, 'native');
    const userData = {
        name: user.name,
        email: user.email,
        image: user.image,
        posts: user.posts,
        _id: user._id,
    };
    const accessToken = signJwt(user.provider, user.name, user.email, user._id);
    console.log(`New user ${user._id} signed up`);
    res.status(200).json({ data: { user: userData, accessToken } });
};

const signin = async (req, res) => {
    const { email, password } = req.body;

    const isUser = await User.userExist(email);
    if (!isUser) {
        return res.status(401).json({ error: 'User not exists.' });
    }
    const user = await User.getUser(email);
    const hash = user.password;
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
        return res.status(401).json({
            error: 'Password is not valid.',
        });
    }
    const userData = {
        name: user.name,
        email: user.email,
        image: user.image,
        posts: user.posts,
        _id: user._id,
    };
    const accessToken = signJwt(user.provider, user.name, user.email, user._id);

    return res.status(200).json({ data: { user: userData, accessToken } });
};

const checkEmail = async (req, res) => {
    const { email } = req.body;
    const isUser = await User.userExist(email);
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (isUser !== null) {
        return res.status(400).json({ error: 'User already exists.' });
    }
    res.status(200).json({ message: 'pass' });
};

const logout = async (req, res) => {
    const { userId, logoutTime } = req.body;
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
    const { name, image, location_pre, type_pre } = req.body;
    let locationPre = {};
    for (let i = 0; i < location_pre.length; i++) {
        locationPre[location_pre[i]] = Number(
            (MaxUserPreferenceScore - i * UserPreferenceScoreDiff).toFixed(1)
        );
    }
    let typePre = {};
    for (let i = 0; i < type_pre.length; i++) {
        typePre[type_pre[i]] = Number(
            (MaxUserPreferenceScore - i * UserPreferenceScoreDiff).toFixed(1)
        );
    }
    const user = await User.updateUserSetting(userId, name, image, locationPre, typePre);
    const topPosts = await Cache.zrevrange('top-posts', 0, -1, 'WITHSCORES');
    await cacheUserNewsfeed(user, topPosts);
    const posts = await Cache.zrevrange(`user:${userId}`, 0, -1);

    return res.status(200).json({ data: { relevantPosts: posts } });
};

const generateUserNewsfeed = async (req, res) => {
    const userId = req.user.id;
    const user = await User.queryUser(userId);
    const topPosts = await Cache.zrevrange('top-posts', 0, -1, 'WITHSCORES');
    await cacheUserNewsfeed(user, topPosts);
    res.status(200).json({ message: `User ${userId} newsfeed cached.` });
};

const getUserPosts = async (req, res) => {
    const userId = req.params.id;
    const { num } = req.query;
    const posts = await User.queryUserPosts(userId, num);
    res.status(200).json({ data: posts });
};

const getUserVisited = async (req, res) => {
    const userId = req.user.id;
    const visitedISO3 = await User.queryUserVisited(userId);
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
