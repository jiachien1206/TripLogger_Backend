import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { Database } from '../util/database.js';
import Cache from '../util/cache.js';
import Post from '../server/models/post_model.js';
import User from '../server/models/user_model.js';
import { UpdateFeeds } from '../util/newsfeedGenerator.js';

import io from 'socket.io-client';

const socket = io.connect(process.env.SERVER, {
    reconnection: true,
});
socket.on('connect', function () {
    console.log('Update read and like worker connect to server');
});

await Database.connect();

let even = false;
const currentMin = new Date().getMinutes();
if (
    (0 <= currentMin && currentMin < 10) ||
    (20 <= currentMin && currentMin < 30) ||
    (40 <= currentMin && currentMin < 50)
) {
    even = true;
}

const updateRead = async (even) => {
    let posts;
    if (even) {
        posts = await Cache.hgetall('post-reads-o');
        Cache.del('post-reads-o');
    } else {
        posts = await Cache.hgetall('post-reads-e');
        Cache.del('post-reads-e');
    }
    for (const [key, value] of Object.entries(posts)) {
        await Post.updateReadNum(key, value);
    }
    console.log(`Posts read number updated.`);
};

const updatePostLikeNum = async (even) => {
    let posts;
    if (even) {
        posts = await Cache.hgetall('post-like-num-o');
        Cache.del('post-like-num-o');
    } else {
        posts = await Cache.hgetall('post-like-num-e');
        Cache.del('post-like-num-e');
    }
    for (const [key, value] of Object.entries(posts)) {
        await Post.updateLikeNum(key, value);
    }
    console.log(`Posts like number updated.`);
};

const updateUserLike = async (even) => {
    let users;
    if (even) {
        users = await Cache.keys('user-like-o-*');
    } else {
        users = await Cache.keys('user-like-e-*');
    }
    users.map(async (user) => {
        const userId = user.slice(12);
        const posts = await Cache.hgetall(user);
        for (const [key, value] of Object.entries(posts)) {
            User.updateUserLiked(userId, key, Number(value));
        }
        await Cache.del(user);
    });
    console.log(`Updated users' liked posts.`);
};

const updateUserScore = async (even) => {
    let users;
    if (even) {
        users = await Cache.keys('user-scores-o-*');
    } else {
        users = await Cache.keys('user-scores-e-*');
    }
    users.map(async (user) => {
        const scores = await Cache.hgetall(user);
        const userId = user.slice(14);
        const locations = ['亞洲', '歐洲', '北美洲', '大洋洲', '南美洲', '非洲', '南極洲'];
        for (const [key, value] of Object.entries(scores)) {
            if (locations.includes(key)) {
                await User.addUserScore(userId, 'location', key, value);
            } else {
                await User.addUserScore(userId, 'tag', key, value);
            }
        }
        Cache.del(user);
    });
    console.log(`Users read and like score updated.`);
};

await updateRead(even);
await updatePostLikeNum(even);
await updateUserLike(even);
await updateUserScore(even);
await UpdateFeeds();
socket.emit('Refresh user newsfeed', 'Online user refresh newsfeed.');
process.exit(0);
