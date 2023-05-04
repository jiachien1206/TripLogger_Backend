import User from '../schemas/user_schema.js';

const userExist = async (email) => {
    const isUser = await User.exists({ email: email });
    return isUser;
};

const signup = async (name, email, password, location_pre, type_pre, provider) => {
    const user = await User.create({ name, email, password, location_pre, type_pre, provider });
    return user;
};

const logout = async (userId, logoutTime) => {
    await User.updateOne({ _id: userId }, { last_login: logoutTime });
};

const getUser = async (email) => {
    const [user] = await User.find({ email: email });
    return user;
};

const queryUser = async (userId) => {
    const user = await User.findById(userId);
    return user;
};

const queryAllUsers = async () => {
    const allUsers = await User.find();
    return allUsers;
};

const queryUserPosts = async (userId, limit) => {
    const [user] = await User.find({ _id: userId }).populate({
        path: 'posts',
        select: ['title', 'main_image', 'dates', 'location', 'type'],
        options: { sort: { 'dates.post_date': -1 }, limit: limit },
    });
    return user.posts;
};

const queryUserVisited = async (userId) => {
    const [user] = await User.find({ _id: userId }).populate({
        path: 'visited',
        select: ['iso3'],
    });
    return user.visited;
};

const addUserScore = async (userId, cat, key, score) => {
    const update = {};

    if (cat === 'location') {
        update[`location_score.${key}`] = score;
    } else {
        update[`type_score.${key}`] = score;
    }
    await User.updateOne({ _id: userId }, { $inc: update });
};

const updateUserSaved = async (userId, postId, save) => {
    if (save) {
        await User.updateOne({ _id: userId }, { $addToSet: { saved_posts: postId } });
    } else {
        await User.updateOne({ _id: userId }, { $pull: { saved_posts: postId } });
    }
};

const updateUserLiked = async (userId, postId, like) => {
    if (like) {
        await User.updateOne({ _id: userId }, { $addToSet: { liked_posts: postId } });
    } else {
        await User.updateOne({ _id: userId }, { $pull: { liked_posts: postId } });
    }
    return true;
};

const queryUserSavedPosts = async (userId) => {
    try {
        const posts = await User.find({ _id: userId }).select('saved_posts');
        if (posts.length === 0) {
            return [];
        } else {
            return posts[0].saved_posts;
        }
    } catch (error) {
        console.log(error);
        return [];
    }
};

const queryUserLikedPosts = async (userId) => {
    try {
        const posts = await User.find({ _id: userId }).select('liked_posts');
        if (posts.length === 0) {
            return [];
        } else {
            return posts[0].liked_posts;
        }
    } catch (error) {
        console.log(error);
        return [];
    }
};

const updateUserSetting = async (userId, name, email, image, location, type) => {
    await User.updateOne(
        { _id: userId },
        { name, email, image, location_pre: location, type_pre: type }
    );
};

const addNotification = async (
    authorId,
    content,
    commentor,
    postId,
    postTitle,
    commenterImg,
    type
) => {
    await User.updateOne(
        { _id: authorId },
        {
            $push: {
                notification: {
                    $each: [{ commentor, postId, postTitle, type, commenterImg, content }],
                    $position: 0,
                    $slice: 6,
                },
            },
        }
    );
};
const getNotification = async (userId) => {
    const notification = await User.findById(userId).select('notification');
    return notification.notification;
};

const readNotification = async (userId) => {
    await User.updateMany({ _id: userId }, { $set: { 'notification.$[].read': true } });
};
export default {
    signup,
    logout,
    getUser,
    userExist,
    queryUser,
    queryAllUsers,
    queryUserPosts,
    queryUserVisited,
    addUserScore,
    updateUserSaved,
    updateUserLiked,
    queryUserSavedPosts,
    queryUserLikedPosts,
    updateUserSetting,
    addNotification,
    getNotification,
    readNotification,
};
