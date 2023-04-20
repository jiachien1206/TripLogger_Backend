import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import { writeComment } from '../controllers/comment_controller.js';
import authentication from '../middlewares/authentication.js';

router.route('/posts/:id/comment').post(authentication, wrapAsync(writeComment));

export default router;
