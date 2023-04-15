import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import authentication from '../middlewares/authentication.js';
import {
    signup,
    signin,
    getUserPosts,
    getUserVisited,
    newsfeedUpdateNotify,
    generateUserNewsfeed,
} from '../controllers/user_controller.js';

router.route('/user/signup').post(wrapAsync(signup));
router.route('/user/signin').post(wrapAsync(signin));
router.route('/user/:id/posts').get(wrapAsync(getUserPosts));
router.route('/user/visited').get(authentication, wrapAsync(getUserVisited));
router.route('/user/newsfeed/notify').post(wrapAsync(newsfeedUpdateNotify));
router.route('/user/newsfeed').post(authentication, wrapAsync(generateUserNewsfeed));

export default router;
