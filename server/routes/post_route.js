import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import {
    getNewPosts,
    getTopPosts,
    getRelevantPosts,
    getContinentPosts,
    deleteRelevantPosts,
    likePost,
    getPost,
    readPost,
    savePost,
    getPostNumbers,
    getPosts,
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
router.route('/posts/:id').get(getPost);
router.route('/posts/:id/read').post(wrapAsync(readPost));
router.route('/posts/:id/like').post(authentication, wrapAsync(likePost));
router.route('/posts/:id/save').post(authentication, wrapAsync(savePost));
router.route('/posts/:id/num').get(wrapAsync(getPostNumbers));
router.route('/posts').get(wrapAsync(getPosts));
router.route('/posts-user-status').get(authentication, wrapAsync(getPostUserStatus));
router.route('/post').post(authentication, wrapAsync(writePost));
router.route('/post/presignUrl').get(authentication, wrapAsync(getPresignUrl));
router.route('/post/:id').put(authentication, wrapAsync(editPost));
router.route('/post/:id').delete(authentication, wrapAsync(deletePost));
router.route('/continents/:continent').get(wrapAsync(getContinentPosts));

export default router;
