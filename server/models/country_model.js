import Country from '../schemas/country_schema.js';

const queryMapPosts = async () => {
    const countries = await Country.find().populate({
        path: 'posts',
        select: ['title', 'score', 'main_image', 'dates.post_date'],
        options: { sort: { score: 1 }, limit: 8 },
    });
    return countries;
};

const addPostToCountry = async (country, postId) => {
    await Country.updateOne({ 'name.cn': country }, { $addToSet: { posts: postId } });
};

export default { queryMapPosts, addPostToCountry };
