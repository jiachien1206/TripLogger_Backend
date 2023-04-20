import Country from '../schema/country_schema.js';

const queryMapPosts = async () => {
    const contries = await Country.find().populate({ path: 'posts', select: ['title'] });
    return contries;
};

const addPostToCountry = async (country, postId) => {
    await Country.updateOne({ 'name.cn': country }, { $addToSet: { posts: postId } });
};

export default { queryMapPosts, addPostToCountry };
