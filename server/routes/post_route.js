import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import {
    getNewPosts,
    getTopPosts,
    getRelevantPosts,
    deleteRelevantPosts,
    likePost,
    getPost,
    readPost,
    savePost,
    getPostNumbers,
    getPostUserStatus,
    writePost,
    getPresignUrl,
    editPost,
    deletePost,
} from '../controllers/post_controller.js';
import authentication from '../middlewares/authentication.js';

router.route('/latest-posts').get(wrapAsync(getNewPosts));
router.route('/top-posts').get(wrapAsync(getTopPosts));
router.route('/relevant-posts').get(authentication, wrapAsync(getRelevantPosts));
router.route('/relevant-posts').delete(authentication, wrapAsync(deleteRelevantPosts));
router.route('/posts/:id').get(getPost);
router.route('/posts/:id/reads').post(readPost);
router.route('/posts/:id/like').post(authentication, wrapAsync(likePost));
router.route('/posts/:id/save').post(authentication, wrapAsync(savePost));
router.route('/posts/:id/num').get(wrapAsync(getPostNumbers));
router.route('/posts-user-status').get(authentication, wrapAsync(getPostUserStatus));
router.route('/post').post(authentication, wrapAsync(writePost));
router.route('/post/presignUrl').get(wrapAsync(getPresignUrl));
router.route('/post/:id').put(authentication, wrapAsync(editPost));
router.route('/post/:id').delete(authentication, wrapAsync(deletePost));

export default router;
