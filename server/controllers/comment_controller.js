import Comment from '../models/comment_model.js';
import Post from '../models/post_model.js';
import Cache from '../../util/cache.js';
import User from '../models/user_model.js';
import { emitCommentMsg } from '../../app.js';

const writeComment = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const content = req.body.comment;
    const { location, type, commenter, authorId, title, commenterImg } = req.body;
    const comment = {
        postId,
        userId,
        content,
    };
    const date = new Date();
    const commentId = await Comment.addComment(comment);
    await Post.addCommentToPost(postId, commentId, date);
    await Cache.hincrby('posts:comment-num', postId, 1);
    const currentMin = new Date().getMinutes();
    if (
        (0 <= currentMin && currentMin < 10) ||
        (20 <= currentMin && currentMin < 30) ||
        (40 <= currentMin && currentMin < 50)
    ) {
        await Cache.hincrby(`user-scores-e-${userId}`, `${location}`, 20);
        await Cache.hincrby(`user-scores-e-${userId}`, `${type}`, 20);
    } else {
        await Cache.hincrby(`user-scores-o-${userId}`, `${location}`, 20);
        await Cache.hincrby(`user-scores-o-${userId}`, `${type}`, 20);
    }

    if (userId !== authorId._id) {
        await User.addNotification(
            authorId._id,
            content,
            commenter,
            postId,
            title,
            commenterImg,
            'comment'
        );
        emitCommentMsg('new notification', authorId._id);
    }

    res.status(200).json({ message: `New comment ${commentId} published.` });
};

export { writeComment };
