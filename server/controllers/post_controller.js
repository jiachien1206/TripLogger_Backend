import Post from '../models/post_model.js';
import User from '../models/user_model.js';
import Cache from '../../util/cache.js';

import { channel } from '../../util/queue.js';
import { presignedUrl } from '../../util/s3.js';

const getNewPosts = async (req, res) => {
    let newPosts = await Cache.get('new-posts');
    newPosts = JSON.parse(newPosts);
    res.status(200).json({ data: newPosts });
};

const getTopPosts = async (req, res) => {
    const posts = await Cache.zrevrange('top-posts', 0, -1);
    const results = posts.map((post) => {
        return JSON.parse(post);
    });
    res.status(200).json({ data: results });
};

const getRelevantPosts = async (req, res) => {
    const userId = req.user.id;
    const posts = await Cache.zrevrange(`user:${userId}`, 0, -1);
    const results = posts.map((post) => {
        return JSON.parse(post);
    });
    res.status(200).json({ data: results });
};

const deleteRelevantPosts = async (req, res) => {
    const userId = req.user.id;
    await Cache.del(userId);
    res.status(200).json({ message: `User ${userId} relevant posts cache deleted.` });
};

const getPost = async (req, res) => {
    const postId = req.params.id;
    const post = await Post.queryPostWithComments(postId);
    if (post.error) {
        return res.status(400).json({ message: "Can't find this post." });
    }
    res.status(200).json({ data: post });
};

const addRead = async (req, res) => {
    const postId = req.params.id;
    const { userId, location, tag } = req.body;
    console.log(userId);
    const currentMin = new Date().getMinutes();
    if (
        (0 <= currentMin && currentMin < 10) ||
        (20 <= currentMin && currentMin < 30) ||
        (40 <= currentMin && currentMin < 50)
    ) {
        if (userId) {
            await Cache.hincrby(`user-scores-e-${userId}`, `${location}`, 1);
            await Cache.hincrby(`user-scores-e-${userId}`, `${tag}`, 1);
        }
        await Cache.hincrby('post-reads-e', postId, 1);
    } else {
        if (userId) {
            await Cache.hincrby(`user-scores-o-${userId}`, `${location}`, 1);
            await Cache.hincrby(`user-scores-o-${userId}`, `${tag}`, 1);
        }
        await Cache.hincrby('post-reads-o', postId, 1);
    }
    res.status(200).json({ message: `Read post ${postId}` });
};

const likePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const { location, tag, like } = req.body;
    const currentMin = new Date().getMinutes();
    if (
        (0 <= currentMin && currentMin < 10) ||
        (20 <= currentMin && currentMin < 30) ||
        (40 <= currentMin && currentMin < 50)
    ) {
        // 偶數時間
        if (like) {
            // Post
            await Cache.hincrby('post-like-num-e', postId, 1);

            await Cache.hset(`user-like-e-${userId}`, { [postId]: 1 });
            await Cache.hincrby(`user-scores-e-${userId}`, `${location}`, 5);
            await Cache.hincrby(`user-scores-e-${userId}`, `${tag}`, 5);
        } else {
            // 取消like
            await Cache.hincrby('post-like-num-e', postId, -1);

            await Cache.hset(`user-like-e-${userId}`, { [postId]: 0 });
            await Cache.hincrby(`user-scores-e-${userId}`, `${location}`, -5);
            await Cache.hincrby(`user-scores-e-${userId}`, `${tag}`, -5);
        }
        // 奇數時間
    } else {
        if (like) {
            // Post
            await Cache.hincrby('post-like-num-o', postId, 1);

            await Cache.hset(`user-like-o-${userId}`, { [postId]: 1 });
            await Cache.hincrby(`user-scores-o-${userId}`, `${location}`, 5);
            await Cache.hincrby(`user-scores-o-${userId}`, `${tag}`, 5);
        } else {
            // 取消like
            await Cache.hincrby('post-like-num-o', postId, -1);

            await Cache.hset(`user-like-o-${userId}`, { [postId]: 0 });
            await Cache.hincrby(`user-scores-o-${userId}`, `${location}`, -5);
            await Cache.hincrby(`user-scores-o-${userId}`, `${tag}`, -5);
        }
    }

    // if (post.error) {
    //     return res.status(400).json({ message: "Can't like this post." });
    // }
    res.status(200).json({ message: `Liked post ${postId}` });
};

const savePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const { location, tag, save } = req.body;
    if (save) {
        await Post.updateSaveNum(postId, 1);
        await User.addUserScore(userId, location, tag, 10);
        await User.updateUserSaved(userId, postId, save);
    } else {
        await Post.updateSaveNum(postId, -1);
        await User.addUserScore(userId, location, tag, -10);
        await User.updateUserSaved(userId, postId, save);
    }
    res.status(200).json({ message: `Saved post ${postId}` });
};

const getPostUserStatus = async (req, res) => {
    const userId = req.user.id;
    const savedPosts = await User.queryUserSavedPosts(userId);
    const likedPosts = await User.queryUserLikedPosts(userId);
    res.status(200).json({ data: { saved_posts: savedPosts, liked_posts: likedPosts } });
};

const getPresignUrl = async (req, res) => {
    const url = await presignedUrl();
    res.status(200).json({ data: url });
};

const writePost = async (req, res) => {
    const content = req.body;
    const userId = req.user.id;
    content.authorId = userId;
    const post = { userId, content, action: 'create' };
    channel.sendToQueue('post-queue', Buffer.from(JSON.stringify(post)));
    console.log('New post send to queue.');
    res.status(200).json({ message: `New post send to queue.` });
};

const editPost = async (req, res) => {
    const content = req.body;
    const userId = req.user.id;
    const postId = req.params.id;
    const isExist = await Post.checkPostUser(postId, userId);
    if (!isExist) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const post = { postId, content, action: 'edit' };
    channel.sendToQueue('post-queue', Buffer.from(JSON.stringify(post)));
    console.log('Edited post send to queue.');
    res.status(200).json({ message: `Edited post send to queue.` });
};

const deletePost = async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id;
    const isExist = await Post.checkPostUser(postId, userId);
    if (!isExist) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const post = { userId, postId, action: 'delete' };
    channel.sendToQueue('post-queue', Buffer.from(JSON.stringify(post)));
    console.log('Deleted post send to queue.');
    res.status(200).json({ message: `Deleted post send to queue.` });
};

export {
    getNewPosts,
    getTopPosts,
    getRelevantPosts,
    deleteRelevantPosts,
    getPost,
    addRead,
    likePost,
    savePost,
    getPostUserStatus,
    writePost,
    getPresignUrl,
    editPost,
    deletePost,
};
