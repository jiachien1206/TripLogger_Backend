import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import { getMapPosts } from '../controllers/country_controller.js';

router.route('/map-posts').get(wrapAsync(getMapPosts));

export default router;
