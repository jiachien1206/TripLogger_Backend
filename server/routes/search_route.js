import express from 'express';
const router = express.Router();

import wrapAsync from '../../util/wrapAsync.js';
import { searchKeyword } from '../controllers/search_controller.js';

router.route('/search').get(wrapAsync(searchKeyword));

export default router;
