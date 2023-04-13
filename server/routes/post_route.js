import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import { getNewPosts } from '../controllers/post_controller.js';

router.route('/latest-posts').get(wrapAsync(getNewPosts));

export default router;
