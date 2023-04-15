import User from '../schemas/user_schema.js';

const userExist = async (email) => {
    const isUser = await User.exists({ email: email });
    return isUser;
};

const signup = async (name, email, password, provider) => {
    const user = await User.create({ name, email, password, provider });
    return user;
};

const getUser = async (email) => {
    const [user] = await User.find({ email: email });
    console.log(user);
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

const queryUserPosts = async (userId) => {
    try {
        const [user] = await User.find({ _id: userId }).populate({
            path: 'posts',
            select: ['title'],
        });
        return user.posts;
    } catch (error) {
        console.log(error);
        return { error };
    }
};

const queryUserVisited = async (userId) => {
    try {
        const [user] = await User.find({ _id: userId }).populate({
            path: 'visited',
            select: ['iso3'],
        });
        return user.visited;
    } catch (error) {
        console.log(error);
        return { error };
    }
};

const addUserScore = async (userId, cat, key, score) => {
    try {
        const update = {};

        if (cat === 'location') {
            update[`location_score.${key}`] = score;
        } else {
            update[`tag_score.${key}`] = score;
        }
        await User.updateOne({ _id: userId }, { $inc: update });
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const updateUserSaved = async (userId, postId, save) => {
    try {
        if (save) {
            await User.updateOne({ _id: userId }, { $addToSet: { saved_posts: postId } });
        } else {
            await User.updateOne({ _id: userId }, { $pull: { saved_posts: postId } });
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const updateUserLiked = async (userId, postId, like) => {
    try {
        if (like) {
            await User.updateOne({ _id: userId }, { $addToSet: { liked_posts: postId } });
        } else {
            await User.updateOne({ _id: userId }, { $pull: { liked_posts: postId } });
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
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

export default {
    signup,
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
};
