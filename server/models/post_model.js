import Post from '../schemas/post_schema.js';

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

export default { queryAllPosts, queryNewPosts };
