import Post from '../schemas/post_schema.js';
import User from '../schemas/user_schema.js';
// import Country from '../schemas/country_schema.js';
import mongoose from 'mongoose';

const queryAllPosts = async () => {
    const allPosts = await Post.find();
    return allPosts;
};

const queryNewPosts = async (limit) => {
    try {
        const newPosts = await Post.find().sort({ 'dates.post_date': 'desc' }).limit(limit);
        return newPosts;
    } catch (err) {
        console.log(err);
    }
};

const queryPostWithComments = async (postId) => {
    try {
        const [post] = await Post.find({ _id: postId }).populate({
            path: 'comments',
            select: ['content', 'userId'],
        });
        return post;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const queryContinentPosts = async (continent) => {
    const posts = await Post.find({ 'location.continent': continent });
    return posts;
};

const updateReadNum = async (postId, readNum) => {
    try {
        await Post.updateOne({ _id: postId }, { $inc: { new_read_num: readNum } });
        return postId;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const updateLikeNum = async (postId, likeNum) => {
    try {
        await Post.updateOne({ _id: postId }, { $inc: { new_like_num: likeNum } });
        return postId;
    } catch (error) {
        console.log(error);
        return { error };
    }
};

const updateSaveNum = async (postId, saveNum) => {
    try {
        await Post.updateOne({ _id: postId }, { $inc: { new_save_num: saveNum } });
        return postId;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const addCommentToPost = async (postId, commentId) => {
    try {
        await Post.updateOne({ _id: postId }, { $push: { comments: commentId } });
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const createPost = async (userId, content) => {
    try {
        const post = await Post.create(content);
        const country = content.location.country;
        const postId = post._id.valueOf();
        let countryId = await Country.findOne({ 'name.cn': country }).select('_id');
        countryId = countryId._id.valueOf();
        await User.updateOne({ _id: userId }, { $addToSet: { posts: postId, visited: countryId } });
        return postId;
    } catch (err) {
        console.log(err);
        return false;
    }
};

const checkPostUser = async (postId, userId) => {
    const isExist = await Post.find({ _id: postId, authorId: userId });
    if (isExist.length !== 0) {
        return true;
    }
    return false;
};

const editPost = async (postId, post) => {
    const { title, content, location, tags, mainImg } = post;
    await Post.updateOne(
        { _id: postId },
        {
            mainImg,
            title,
            content,
            location: { continent: location.continent, country: location.country },
            tags,
        }
    );
};

const deletePost = async (userId, postId) => {
    await Post.deleteOne({ _id: postId });
    await User.updateOne({ _id: userId }, { $pull: { posts: postId } });
};

export default {
    queryAllPosts,
    queryNewPosts,
    queryPostWithComments,
    queryContinentPosts,
    updateReadNum,
    updateLikeNum,
    updateSaveNum,
    addCommentToPost,
    createPost,
    checkPostUser,
    editPost,
    deletePost,
};
