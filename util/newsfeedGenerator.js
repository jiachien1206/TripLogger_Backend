import dotenv from 'dotenv';
import Cache from './cache.js';
import Post from '../server/models/post_model.js';
import User from '../server/models/user_model.js';
import { roundTo } from './util.js';
import { AlgoCoefficients } from '../constants.js';
import { cacheUserNewsfeed } from '../util/cacheUserNewsfeed.js';
dotenv.config({ path: '../.env' });

const cacheNewPosts = async () => {
    const newPostsNumber = 500;
    const posts = await Post.queryNewPosts(newPostsNumber);

    const postString = posts.map((post) => {
        return JSON.stringify(post);
    });
    console.log(postString);
    await Cache.rpush('new-posts', postString);
    await Cache.ltrim('new-posts', newPostsNumber, -1);
    console.log(`New posts cached at ${new Date()}.`);
};

const calculatePostsScore = async () => {
    let maxScore = AlgoCoefficients.initialMaxScore;
    const maxCalculatePostsNumber = 10000;

    const postBoostScore = (originalNum, newNum, coefficient) => {
        return (originalNum * AlgoCoefficients.lastWeight + newNum - originalNum) * coefficient;
    };

    const posts = await Post.queryPosts(maxCalculatePostsNumber);
    posts.forEach((post) => {
        const {
            read_num,
            like_num,
            save_num,
            comment_num,
            new_read_num,
            new_like_num,
            new_save_num,
            new_comment_num,
        } = post;

        // Calculate behavior numbers to post score
        post.score =
            postBoostScore(read_num, new_read_num, AlgoCoefficients.readBoost) +
            postBoostScore(like_num, new_like_num, AlgoCoefficients.likeBoost) +
            postBoostScore(save_num, new_save_num, AlgoCoefficients.saveBoost) +
            postBoostScore(comment_num, new_comment_num, AlgoCoefficients.commentBoost);
        // Time decay
        post.score = roundTo(
            post.score *
                Math.exp(
                    AlgoCoefficients.timeDecayCoefficient *
                        ((new Date() - post.dates.last_interact) /
                            AlgoCoefficients.newsfeedUpdateFrquency)
                ),
            5
        );

        // Transfer new number to old number
        post.read_num = new_read_num;
        post.like_num = new_like_num;
        post.save_num = new_save_num;
        post.comment_num = new_comment_num;
        post.save();

        if (post.score > maxScore) {
            maxScore = post.score;
        }
    });
    return maxScore;
};

const cacheTopPosts = async (maxScore) => {
    const topPostsNumber = 500;
    const allPosts = await Post.queryPosts(topPostsNumber);

    // Cache each top posts
    await Promise.all(allPosts.map((post) => Cache.hset('posts', post._id, JSON.stringify(post))));

    const postNormalized = allPosts.map((p) => {
        return { post: JSON.stringify(p), score: p.score / maxScore };
    });
    await Cache.del('top-posts');
    await Cache.zadd(
        'top-posts',
        ...postNormalized.map(({ post, score }) => [roundTo(score, 5), post])
    );
    console.log(`Top posts cached at ${new Date()}`);
};

const cacheUsersNewsfeed = async () => {
    const allUsers = await User.queryAllUsers();
    const topPosts = await Cache.zrevrange('top-posts', 0, -1, 'WITHSCORES');
    await Promise.all(allUsers.map((user) => cacheUserNewsfeed(user, topPosts)));
    console.log(`Users newsfeed cached at ${new Date()}`);
};

const UpdateFeeds = async () => {
    try {
        await cacheNewPosts();
        const maxScore = await calculatePostsScore();
        await cacheTopPosts(maxScore);
        await cacheUsersNewsfeed();
    } catch (error) {
        console.error(error);
    }
};

export { UpdateFeeds };
