import Country from '../models/country_model.js';

const getMapPosts = async (req, res) => {
    const mapPosts = await Country.queryMapPosts();
    res.status(200).json({ data: mapPosts });
};

export { getMapPosts };
