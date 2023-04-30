import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import Cache from './cache.js';
import Post from '../server/models/post_model.js';
import User from '../server/models/user_model.js';

const time = new Date();

const calculatePostsScore = async (maxScore) => {
    const allPosts = await Post.queryAllPosts();
    allPosts.map((post) => {
        // (舊的數量*0.8+新的數量)*boost
        post.score =
            (post.read_num * 0.8 + post.new_read_num - post.read_num) * 1.05 +
            (post.like_num * 0.8 + post.new_like_num - post.like_num) * 1.5 +
            (post.save_num * 0.8 + post.new_save_num - post.save_num) * 4 +
            (post.comment_num * 0.8 + post.new_comment_num - post.comment_num) * 6;
        // Time decay
        post.score =
            post.score * Math.exp(-0.03 * ((new Date() - post.dates.last_interact) / 600000));

        // 新的數量轉移到舊數量
        post.read_num = post.new_read_num;
        post.like_num = post.new_like_num;
        post.save_num = post.new_save_num;
        post.comment_num = post.new_comment_num;
        post.save();
        // 找最大分數
        if (post.score > maxScore) {
            maxScore = post.score;
        }
    });
    return maxScore;
};
const topPosts = async (maxScore) => {
    try {
        const allPosts = await Post.queryAllPosts();
        const postNormalized = allPosts.reduce((acc, post) => {
            acc.push({
                post: JSON.stringify(post),
                score: (post.score - 0) / (maxScore - 0),
            });
            return acc;
        }, []);
        await Cache.del('top-posts');
        await Cache.zadd(
            'top-posts',
            ...postNormalized.map(({ post, score }) => [Math.round(score * 10000) / 10000, post])
        );
        console.log(`Top posts cached at ${time}`);
    } catch (e) {
        console.log(e);
    }
};
const newPosts = async (limit) => {
    const posts = await Post.queryNewPosts(limit);
    await Cache.set('new-posts', JSON.stringify(posts));
    console.log(`New posts cached at ${time}.`);
};
const setUserNewsfeed = async () => {
    try {
        const allUsers = await User.queryAllUsers();

        // 取出TOP100篇文章
        const posts = await Cache.zrevrange('top-posts', 0, 99, 'WITHSCORES');

        // 讀取每個user的資料
        for (const user of allUsers) {
            // 把每個類別的分數加總
            const locationScoreSum = Object.values(user.location_score).reduce(
                (acc, score) => acc + score,
                0
            );
            const typeScoreSum = Object.values(user.type_score).reduce(
                (acc, score) => acc + score,
                0
            );

            // 把每個類別的分數除以加總獲得比例*user自己預設的喜好排序
            let locationScore = {};
            for (const [key, value] of Object.entries(user.location_score)) {
                const score = user.location_pre[key] * (value / locationScoreSum);
                locationScore[key] = score;
            }

            let typeScore = {};
            for (const [key, value] of Object.entries(user.type_score)) {
                const score = user.type_pre[key] * (value / typeScoreSum);
                typeScore[key] = score;
            }
            const newsFeed = [];

            for (let i = 0; i < posts.length; i++) {
                if (!(i % 2)) {
                    newsFeed.push({ post: posts[i] });
                } else {
                    const location = JSON.parse(newsFeed[Math.floor(i / 2)].post).location
                        .continent;
                    const type = JSON.parse(newsFeed[Math.floor(i / 2)].post).type;
                    // TOP文章分數*user對該location分數*user對該category分數
                    newsFeed[Math.floor(i / 2)].score =
                        Number(posts[i]) * locationScore[location] * typeScore[type];
                }
            }
            // 丟進Redis sorted set
            const userId = user._id;
            await Cache.unlink([`user:${userId}`]);
            await Cache.zadd(
                `user:${userId}`,
                ...newsFeed.map(({ post, score }) => [Math.round(score * 1000000) / 1000, post])
            );
            await Cache.expire(`user:${userId}`, 86400);
        }
        console.log(`Users newsfeed cached at ${time}`);
    } catch (error) {
        console.log(error);
    }
};

const UpdateFeeds = async () => {
    try {
        // 更新每篇文章的分數
        let maxScore = await calculatePostsScore(0);
        // 丟進Redis sorted set
        await topPosts(maxScore);
        // 抓最新的所有文章
        await newPosts(500);
        // 丟進Redis sorted set
        await setUserNewsfeed();
    } catch (error) {
        console.log(error);
    }
};

export { UpdateFeeds };
