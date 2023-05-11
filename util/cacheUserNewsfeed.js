import { roundTo } from './roundToNum.js';
import Cache from './cache.js';

export const cacheUserNewsfeed = async (user, topPosts) => {
    // Caculate user location and type scores sum
    const locationScoreSum = Object.values(user.location_score).reduce(
        (acc, score) => acc + score,
        0
    );
    const typeScoreSum = Object.values(user.type_score).reduce((acc, score) => acc + score, 0);

    // Preference setting times each category scores divided by category total score
    const caculateScore = (preference, score, sum) => {
        return Object.entries(score).reduce((acc, [key, value]) => {
            acc[key] = preference[key] * (value / sum);
            return acc;
        }, {});
    };

    const locationScore = caculateScore(user.location_pre, user.location_score, locationScoreSum);
    const typeScore = caculateScore(user.type_pre, user.type_score, typeScoreSum);

    // Cache post id in newsfeed
    const newsFeed = [];
    for (let i = 0; i < topPosts.length; i++) {
        if (!(i % 2)) {
            newsFeed.push({ post: JSON.parse(topPosts[i])._id });
        } else {
            const location = JSON.parse(topPosts[i - 1]).location.continent;
            const type = JSON.parse(topPosts[i - 1]).type;
            const postScore = Number(topPosts[i]);

            newsFeed[Math.floor(i / 2)].score =
                postScore * locationScore[location] * typeScore[type];
        }
    }
    const userId = user._id;
    await Cache.del([`user:${userId}`]);
    await Cache.zadd(
        `user:${userId}`,
        ...newsFeed.map(({ post, score }) => [roundTo(score, 8), post])
    );
    await Cache.expire(`user:${userId}`, 86400);
};
