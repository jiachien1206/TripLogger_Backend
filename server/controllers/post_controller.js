import Post from '../models/post_model.js';
import Cache from '../../util/cache.js';

const getNewPosts = async (req, res) => {
    let newPosts = await Cache.get('new-posts');
    newPosts = JSON.parse(newPosts);
    res.status(200).json({ data: newPosts });
};

export { getNewPosts };
