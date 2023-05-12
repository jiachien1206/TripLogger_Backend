import Comment from '../models/comment_model.js';
import Post from '../models/post_model.js';
import User from '../models/user_model.js';
import { emitCommentMsg } from '../../socketIO.js';
import { MemberBehaviorProcessor } from '../../util/behaviorProcessor.js';

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
    const processor = new MemberBehaviorProcessor(postId, 'comment', userId, location, type, true);
    await processor.processNumberScore();

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
