import dotenv from 'dotenv';
import { Database } from '../util/database.js';
import Cache from '../util/cache.js';
import Post from '../server/models/post_model.js';
import User from '../server/models/user_model.js';
import { UpdateFeeds } from '../util/newsfeedGenerator.js';
import io from 'socket.io-client';
import { isEvenTime } from '../util/util.js';
import { Locations } from '../constants.js';
dotenv.config({ path: '../.env' });

const updatePostNumbers = async (type, updateFunction) => {
    const posts = await Cache.hgetall(`posts:${type}-num`);
    await Promise.all(Object.entries(posts).map(([key, value]) => updateFunction(key, value)));
    console.log(`Posts ${type} number updated.`);
};

const updateUserLike = async (isEvenTime) => {
    const users = isEvenTime()
        ? await Cache.keys('user-like-o-*')
        : await Cache.keys('user-like-e-*');

    await Promise.all(
        users.map(async (user) => {
            const posts = await Cache.hgetall(user);
            const userId = user.slice(12);

            await Promise.all(
                Object.entries(posts).map(([key, value]) => {
                    return User.updateUserLiked(userId, key, Number(value));
                })
            );
            await Cache.del(user);
        })
    );
    console.log(`Updated users' liked posts.`);
};

const updateUserScore = async (isEvenTime) => {
    const users = isEvenTime()
        ? await Cache.keys('user-scores-o-*')
        : await Cache.keys('user-scores-e-*');

    await Promise.all(
        users.map(async (user) => {
            const scores = await Cache.hgetall(user);
            const userId = user.slice(14);

            await Promise.all(
                Object.entries(scores).map(async ([key, value]) => {
                    if (Locations.includes(key)) {
                        await User.addUserScore(userId, 'location', key, value);
                    } else {
                        await User.addUserScore(userId, 'type', key, value);
                    }
                })
            );
            await Cache.del(user);
        })
    );
    console.log(`Users read and like score updated.`);
};

await Database.connect();

const socket = io.connect(process.env.SERVER, {
    reconnection: true,
});
socket.on('connect', async function () {
    console.log('Update numbers worker connect to server');
    try {
        const updateTypes = ['Like', 'Save', 'Read', 'Comment'];
        const updateBehaviorNums = updateTypes.map((type) =>
            updatePostNumbers(type.toLowerCase(), Post[`update${type}Num`])
        );
        const updateUserLikeAndScore = [updateUserLike(isEvenTime), updateUserScore(isEvenTime)];

        await Promise.all([...updateBehaviorNums, ...updateUserLikeAndScore]);
        await UpdateFeeds();

        socket.emit('Refresh user newsfeed', 'Online user refresh newsfeed.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
