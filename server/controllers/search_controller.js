import dotenv from 'dotenv';
import Search from '../models/search_model.js';
dotenv.config();

const searchKeyword = async (req, res) => {
    const { keyword } = req.query;
    const results = await Search.searchPosts(keyword);
    const data = results.map((result) => {
        const { id, title, content, main_image, type, continent, country, date } = result._source;
        return {
            url: `${process.env.DOMAIN}/post/${id}`,
            title,
            content,
            main_image,
            type,
            continent,
            country,
            date,
        };
    });

    res.status(200).json({ data });
};

export { searchKeyword };
