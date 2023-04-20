import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import authentication from '../middlewares/authentication.js';
import {
    signup,
    signin,
    getUserData,
    editUserSetting,
    getUserPosts,
    getUserVisited,
    generateUserNewsfeed,
} from '../controllers/user_controller.js';

router.route('/user/signup').post(wrapAsync(signup));
router.route('/user/signin').post(wrapAsync(signin));
router.route('/users/:id/setting').get(authentication, wrapAsync(getUserData));
router.route('/users/:id/setting').put(authentication, wrapAsync(editUserSetting));
router.route('/users/:id/posts').get(wrapAsync(getUserPosts));
router.route('/users/:id/visited').get(authentication, wrapAsync(getUserVisited));
router.route('/user/newsfeed').post(authentication, wrapAsync(generateUserNewsfeed));

export default router;
