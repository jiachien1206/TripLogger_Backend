import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import authentication from '../middlewares/authentication.js';
import {
    signup,
    signin,
    checkEmail,
    logout,
    getUserData,
    editUserSetting,
    getUserPosts,
    getUserVisited,
    getUserSavedPosts,
    generateUserNewsfeed,
    getUserNotification,
    readUserNotification,
} from '../controllers/user_controller.js';

router.route('/user/signup').post(wrapAsync(signup));
router.route('/user/signin').post(wrapAsync(signin));
router.route('/user/signup-email').post(wrapAsync(checkEmail));
router.route('/users/:id/logout').post(wrapAsync(logout));
router.route('/user/setting').get(authentication, wrapAsync(getUserData));
router.route('/user/setting').put(authentication, wrapAsync(editUserSetting));
router.route('/user/:id/posts').get(wrapAsync(getUserPosts));
router.route('/user/visited').get(authentication, wrapAsync(getUserVisited));
router.route('/user/saved').post(authentication, wrapAsync(getUserSavedPosts));
router.route('/user/newsfeed').post(authentication, wrapAsync(generateUserNewsfeed));
router.route('/user/notification').get(authentication, wrapAsync(getUserNotification));
router.route('/user/notification').put(authentication, wrapAsync(readUserNotification));

export default router;
