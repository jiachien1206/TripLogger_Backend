import dotenv from 'dotenv';
dotenv.config();
import Es from '../../util/elasticsearch.js';
const searchPosts = async (keyword) => {
    const searchResponse = await Es.search({
        index: process.env.ES_INDEX,
        body: {
            size: 40,
            query: {
                multi_match: {
                    fields: ['title', 'content'],
                    query: keyword,
                    fuzziness: 'AUTO',
                    operator: 'or',
                },
            },
        },
    });
    return searchResponse.hits.hits;
};

export default { searchPosts };
