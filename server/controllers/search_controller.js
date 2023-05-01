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
            url: `${process.env.DOMAIN}/post/${result._source.id}`,
            title: result._source.title,
            content: result._source.content,
            main_image: result._source.main_image,
            type: result._source.type,
            continent: result._source.continent,
            country: result._source.country,
            date: result._source.date,
        };
    });
    res.status(200).json({ data });
};

export { searchKeyword };
