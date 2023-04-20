import Comment from '../schemas/comment_schema.js';

const addComment = async (comment) => {
    const result = await Comment.create(comment);
    return result._id;
};

export default { addComment };
