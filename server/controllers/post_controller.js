import Post from '../models/post_model.js';
import User from '../models/user_model.js';
import Country from '../models/country_model.js';
import Cache from '../../util/cache.js';
import { Types, ContinentMap, PageNumber } from '../../constants.js';
import { channel } from '../../util/queue.js';
import { presignedUrl } from '../../util/s3.js'; // get
import { isEvenTime } from '../../util/util.js';
import { GuestBehaviorProcessor, MemberBehaviorProcessor } from '../../util/behaviorProcessor.js';

const getNewPosts = async (req, res) => {
    const paging = Number(req.query.paging) || 1;
    const pagePosts = await Cache.lrange(
        'new-posts',
        (paging - 1) * PageNumber,
        paging * PageNumber - 1
    );
    const posts = pagePosts.map((post) => {
        return JSON.parse(post);
    });
    const postsNum = await Cache.llen('new-posts');
    const data = {
        posts,
        postsNum,
    };
    res.status(200).json({ data });
};

const getTopPosts = async (req, res) => {
    const paging = Number(req.query.paging) || 1;
    const pagePosts = await Cache.zrevrange(
        'top-posts',
        (paging - 1) * PageNumber,
        paging * PageNumber - 1
    );
    const posts = pagePosts.map((post) => {
        return JSON.parse(post);
    });
    const postsNum = await Cache.zcard('top-posts');
    const data = {
        posts,
        postsNum,
    };
    res.status(200).json({ data });
};

const getContinentPosts = async (req, res) => {
    const { continent } = req.params;

    const paging = Number(req.query.paging) || 1;
    let types = req.query.types || Types;
    types = types.split(',');

    const postsNum = await Post.countContinentPostsLength(ContinentMap[continent], types);
    const posts = await Post.queryContinentPosts(
        ContinentMap[continent],
        types,
        paging,
        PageNumber
    );
    res.status(200).json({ data: { postsNum, posts } });
};

const getRelevantPosts = async (req, res) => {
    const userId = req.user.id;
    const posts = await Cache.zrevrange(`user:${userId}`, 0, -1);
    res.status(200).json({ data: posts });
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

const readPost = async (req, res) => {
    const postId = req.params.id;
    const { userId, location, type } = req.body;

    if (!userId) {
        const processor = new GuestBehaviorProcessor(postId, 'read');
        await processor.addNum(1);
    } else {
        const processor = new MemberBehaviorProcessor(postId, 'read', userId, location, type, true);
        await processor.processNumberScore();
    }

    res.status(200).json({ message: `Read post ${postId}` });
};

const likePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const { location, type, isPositive } = req.body;

    const processor = new MemberBehaviorProcessor(
        postId,
        'like',
        userId,
        location,
        type,
        isPositive
    );
    await processor.processNumberScore();
    const time = isEvenTime() ? 'e' : 'o';
    await Cache.hset(`user-like-${time}-${userId}`, { [postId]: isPositive ? 1 : 0 });

    res.status(200).json({ message: `Liked post ${postId}` });
};

const savePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;
    const { location, type, isPositive } = req.body;
    await User.updateUserSaved(userId, postId, isPositive);
    const processor = new MemberBehaviorProcessor(
        postId,
        'save',
        userId,
        location,
        type,
        isPositive
    );
    await processor.processNumberScore();

    res.status(200).json({ message: `Saved post ${postId}` });
};

const getPosts = async (req, res) => {
    const { ids } = req.query;
    // FIXME: ids有錯？？？？
    const postIds = ids.split(',');
    let posts = [];
    for (let i = 0; i < postIds.length; i++) {
        const post = await Cache.hget('posts', postIds[i]);
        posts.push(JSON.parse(post));
    }
    res.status(200).json({ data: posts });
};

const getPostNumbers = async (req, res) => {
    const postId = req.params.id;
    // FIXME: 不用await用promise all
    const readNum = await Cache.hget('posts:read-num', postId);
    const likeNum = await Cache.hget('posts:like-num', postId);
    const saveNum = await Cache.hget('posts:save-num', postId);
    const commentNum = await Cache.hget('posts:comment-num', postId);
    res.status(200).json({
        data: {
            read_num: Number(readNum),
            like_num: Number(likeNum),
            save_num: Number(saveNum),
            comment_num: Number(commentNum),
        },
    });
};

const getPostUserStatus = async (req, res) => {
    const userId = req.user.id;
    // FIXME: promise all
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
    if (
        !content.main_image ||
        content.title.length < 1 ||
        content.title.length > 100 ||
        !content.dates.start_date ||
        !content.dates.end_date ||
        new Date(content.dates.start_date) > new Date(content.dates.end_date) ||
        content.content.length < 10 ||
        content.content.length > 20500 ||
        !content.type ||
        !content.location.continent ||
        !content.location.country
    ) {
        return res.status(400).json({ error: `Content format error` });
    }
    const postId = await Post.createPost(userId, content);
    if (!postId) {
        return res.status(500).json({ error: `New post created failed.` });
    }
    console.log(`Post ${postId} created.`);
    const country = content.location.country;
    await Country.addPostToCountry(country, postId);
    const [post] = await Post.queryPostsByIds([postId]);
    await Cache.lpush('new-posts', JSON.stringify(post));
    await Cache.rpop('new-posts');
    const esPostId = await Post.esCreatePost(postId, content);
    // if (!esPostId) {
    //     return res.status(500).json({ error: `Elasticsearch created ${postId} failed.` });

    // }
    console.log(`New post ${esPostId} saved to elasticsearch.`);
    channel.sendToQueue('post-queue', Buffer.from(JSON.stringify(postId)));
    console.log('Update newsfeed job send to queue.');
    res.status(200).json({ data: postId });
};

const editPost = async (req, res) => {
    const content = req.body;
    const userId = req.user.id;
    const postId = req.params.id;
    const isExist = await Post.checkPostUser(postId, userId);
    if (!isExist) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (
        !content.main_image ||
        content.title.length < 1 ||
        content.title.length > 100 ||
        content.content.length < 10 ||
        content.content.length > 20500
    ) {
        return res.status(400).json({ error: `Content format error` });
    }
    await Post.editPost(postId, content);
    console.log(`Post ${postId} edited.`);
    await Post.esEditPost(postId, content);
    console.log(`Post edited from elasticsearch.`);
    channel.sendToQueue('post-queue', Buffer.from(JSON.stringify(postId)));
    console.log('Update newsfeed job send to queue.');
    res.status(200).json({ data: postId });
};

const deletePost = async (req, res) => {
    const userId = req.user.id;
    const postId = req.params.id;
    const isExist = await Post.checkPostUser(postId, userId);
    if (!isExist) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = { postId, userId, event: 'delete' };
    channel.sendToQueue('post-queue', Buffer.from(JSON.stringify(data)));
    console.log('Update newsfeed job send to queue.');
    res.status(200).json({ data: postId });
};

export {
    getNewPosts,
    getTopPosts,
    getRelevantPosts,
    getContinentPosts,
    deleteRelevantPosts,
    getPost,
    readPost,
    likePost,
    savePost,
    getPostNumbers,
    getPosts,
    getPostUserStatus,
    writePost,
    getPresignUrl,
    editPost,
    deletePost,
};
