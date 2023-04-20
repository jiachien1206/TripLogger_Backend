import dotenv from 'dotenv';
dotenv.config();
import Search from '../models/search_model.js';

const searchKeyword = async (req, res) => {
    if (!req.query.keyword) {
        return res.status(400).json({ error: 'Invalid Keyword' });
    }

    const { keyword } = req.query;
    const results = await Search.searchPosts(keyword);
    const data = results.map((result) => {
        return {
            url: `${env.process.DOMAIN}/post/${result._source.id}`,
            title: result._source.title,
            content: result._source.content,
        };
    });
    res.status(200).json({ data });
};

export { searchKeyword };
