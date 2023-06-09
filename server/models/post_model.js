import dotenv from 'dotenv';
dotenv.config();
import Post from '../schemas/post_schema.js';
import User from '../schemas/user_schema.js';
import Country from '../schemas/country_schema.js';
import Comment from '../schemas/comment_schema.js';
import Es from '../../util/elasticsearch.js';
const { ES_INDEX } = process.env;

const queryPosts = async (limit) => {
    const posts = await Post.find()
        .sort({ score: 'desc' })
        .populate({
            path: 'authorId',
            select: ['name', 'image'],
        })
        .limit(limit);
    return posts;
};

const queryNewPosts = async (limit) => {
    const newPosts = await Post.find(
        {},
        {
            _id: 1,
            'location.continent': 1,
            'location.country': 1,
            'dates.post_date': 1,
            title: 1,
            authorId: 1,
            main_image: 1,
            type: 1,
            content: 1,
        }
    )
        .sort({ 'dates.post_date': 'desc' })
        .populate({
            path: 'authorId',
            select: ['name', 'image'],
        })
        .limit(limit);
    return newPosts;
};

const queryPostWithComments = async (postId) => {
    try {
        const [post] = await Post.find(
            { _id: postId },
            {
                _id: 1,
                'location.continent': 1,
                'location.country': 1,
                'dates.post_date': 1,
                'dates.start_date': 1,
                'dates.end_date': 1,
                title: 1,
                authorId: 1,
                main_image: 1,
                type: 1,
                content: 1,
                comments: 1,
            }
        )
            .populate({
                path: 'comments',
                select: ['content', 'userId', 'timestamp'],
                populate: {
                    path: 'userId',
                    select: ['name', 'image'],
                },
            })
            .populate({
                path: 'authorId',
                select: ['name', 'image'],
            });
        return post;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const queryPostsByIds = async (postIds) => {
    const posts = await Post.find({ _id: { $in: postIds } })
        .sort({ 'dates.post_date': 'desc' })
        .populate({
            path: 'authorId',
            select: ['name', 'image'],
        });
    return posts;
};

const countContinentPostsLength = async (continent, types) => {
    const num = await Post.find({
        'location.continent': continent,
        type: { $in: types },
    }).count();
    return num;
};

const queryContinentPosts = async (continent, types, paging, pageNumber) => {
    const posts = await Post.find({
        'location.continent': continent,
        type: { $in: types },
    })
        .sort({ 'dates.post_date': 'desc' })
        .skip((paging - 1) * pageNumber)
        .limit(pageNumber)
        .populate({
            path: 'authorId',
            select: ['name', 'image'],
        });
    return posts;
};

const updateReadNum = async (postId, readNum) => {
    try {
        await Post.updateOne({ _id: postId }, { new_read_num: readNum });
        return postId;
    } catch (error) {
        console.log(error);
        return false;
    }
};

const updateLikeNum = async (postId, likeNum) => {
    await Post.updateOne({ _id: postId }, { new_like_num: likeNum });
};

const updateSaveNum = async (postId, saveNum) => {
    await Post.updateOne({ _id: postId }, { new_save_num: saveNum });
};

const updateCommentNum = async (postId, commentNum) => {
    await Post.updateOne({ _id: postId }, { new_comment_num: commentNum });
};

const addCommentToPost = async (postId, commentId, date) => {
    await Post.updateOne(
        { _id: postId },
        { $push: { comments: commentId }, $set: { 'dates.last_interact': date } }
    );
};

const createPost = async (userId, content) => {
    const post = await Post.create(content);
    const country = content.location.country;
    const postId = post._id.valueOf();
    let countryId = await Country.findOne({ 'name.cn': country }).select('_id');
    countryId = countryId._id.valueOf();
    await User.updateOne({ _id: userId }, { $push: { posts: postId, visited: countryId } });
    return postId;
};

const esCreatePost = async (postId, post) => {
    const date = new Date();
    const esPost = await Es.index({
        index: process.env.ES_INDEX,
        body: {
            id: postId,
            title: post.title,
            content: post.content,
            main_image: post.main_image,
            continent: post.location.continent,
            country: post.location.country,
            type: post.type,
            date,
        },
    });
    return esPost._id;
};

const checkPostUser = async (postId, userId) => {
    const isExist = await Post.find({ _id: postId, authorId: userId });
    if (isExist.length !== 0) {
        return true;
    }
    return false;
};

const editPost = async (postId, post) => {
    const { title, content, location, type, main_image } = post;
    await Post.updateOne(
        { _id: postId },
        {
            main_image,
            title,
            content,
        }
    );
};

const esEditPost = async (postId, post) => {
    await Es.updateByQuery({
        index: ES_INDEX,
        refresh: true,
        body: {
            query: {
                match: {
                    id: postId,
                },
            },
            script: {
                inline: `ctx._source.title = "${post.title}"; ctx._source.content= "${post.content}";ctx._source.main_image= "${post.main_image}";`,
                lang: 'painless',
            },
        },
    });
};

const deletePost = async (userId, postId) => {
    const post = await Post.findOne({ _id: postId }, { 'location.country': 1 });
    const { country } = post.location;
    const countryId = await Country.findOne({ 'name.cn': country }, { _id: 1 });
    const user = await User.findById(userId);
    const newVisted = [];
    let popped = 0;
    user.visited.forEach((country) => {
        if (country.toString() === countryId._id.toString() && popped === 0) {
            popped += 1;
        } else {
            newVisted.push(country);
        }
    });
    user.visited = newVisted;
    user.save();
    await User.updateOne({ _id: userId }, { $pull: { posts: postId } });
    await Comment.deleteMany({
        postId: postId,
    });
    await Post.deleteOne({ _id: postId });
};

const esDeletePost = async (postId) => {
    await Es.deleteByQuery({
        index: ES_INDEX,
        body: {
            query: {
                match: { id: postId },
            },
        },
    });
};

export default {
    queryPosts,
    queryNewPosts,
    queryPostWithComments,
    queryPostsByIds,
    countContinentPostsLength,
    queryContinentPosts,
    updateReadNum,
    updateLikeNum,
    updateSaveNum,
    updateCommentNum,
    addCommentToPost,
    createPost,
    checkPostUser,
    editPost,
    deletePost,
    esCreatePost,
    esEditPost,
    esDeletePost,
};
