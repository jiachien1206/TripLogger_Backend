import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { Database } from '../util/database.js';
import { Queue, channel } from '../util/queue.js';
import Post from '../server/models/post_model.js';
import Country from '../server/models/country_model.js';
import { UpdateFeeds } from '../util/newsfeedGenerator.js';
import io from 'socket.io-client';

const socket = io.connect(process.env.SERVER, {
    reconnection: true,
});
socket.on('connect', function () {
    console.log('Post consumer connect to server');
});
await Database.connect();
await Queue.connect();

const consumePost = async () => {
    await channel.consume('post-queue', async (data) => {
        try {
            const d = JSON.parse(Buffer.from(data.content));
            const { userId, postId, event } = d;
            if (event === 'delete') {
                console.log(event);
                await Post.deletePost(userId, postId);
                console.log(`Post ${postId} deleted.`);
                await Post.esDeletePost(postId);
                console.log(`Post ${postId} deleted from elasticsearch.`);
            }
            await UpdateFeeds();
            socket.emit('Refresh user newsfeed', 'Online user refresh newsfeed.');
        } catch (error) {
            console.log(error);
        } finally {
            channel.ack(data);
        }
    });
};

await consumePost();
