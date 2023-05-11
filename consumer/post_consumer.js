import dotenv from 'dotenv';
import { Database } from '../util/database.js';
import { Queue, channel } from '../util/queue.js';
import Post from '../server/models/post_model.js';
import { UpdateFeeds } from '../util/newsfeedGenerator.js';
import io from 'socket.io-client';

dotenv.config({ path: '../.env' });

const connectSocket = () => {
    const socket = io.connect(process.env.SERVER, {
        reconnection: true,
    });

    socket.on('connect', function () {
        console.log('Post consumer connect to server');
    });
    return socket;
};

const deletePost = async (userId, postId) => {
    await Post.deletePost(userId, postId);
    console.log(`Post ${postId} deleted.`);
    await Post.esDeletePost(postId);
    console.log(`Post ${postId} deleted from elasticsearch.`);
};

const consumePost = async (socket) => {
    await channel.consume('post-queue', async (data) => {
        try {
            const { userId, postId, event } = JSON.parse(Buffer.from(data.content));
            if (event === 'delete') {
                await deletePost(userId, postId);
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

const startConsumer = async () => {
    try {
        await Database.connect();
        await Queue.connect();
        const socket = connectSocket();
        await consumePost(socket);
    } catch (e) {
        console.error(e);
    }
};
startConsumer();
