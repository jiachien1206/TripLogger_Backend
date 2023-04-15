import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { Database } from '../util/database.js';
import { Queue, channel } from '../util/queue.js';
import Post from '../server/models/post_model.js';
import Country from '../server/models/country_model.js';
import { UpdateFeeds } from '../util/newsfeedGenerator.js';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:8080/', {
    reconnection: true,
});
socket.on('connect', function () {
    console.log('Post consumer connect to server');
});
await Database.connect();
await Queue.connect();

const consumePost = async () => {
    await channel.consume('post-queue', async (data) => {
        const post = JSON.parse(Buffer.from(data.content));
        try {
            if (post.action === 'create') {
                const postId = await Post.createPost(post.userId, post.content);
                if (!postId) {
                    throw new Error();
                } else {
                    console.log(`Post ${postId} created.`);
                    const country = post.content.location.country;
                    await Country.addPostToCountry(country, postId);
                }
            } else if (post.action === 'edit') {
                await Post.editPost(post.postId, post.content);
                console.log(`Post ${post.postId} edited.`);
            } else if (post.action === 'delete') {
                await Post.deletePost(post.userId, post.postId);
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
