import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const userSchema = new Schema({
    name: { type: String, required: [true, 'Please fill the user name.'], maxLength: 100 },
    email: { type: String, required: [true, 'Please fill email.'], lowercase: true },
    password: { type: String, required: [true, 'Please fill password.'] },
    image: { type: String, default: '' },
    provider: { type: String, required: true, enum: ['native'] },
    type_score: {
        交通: { type: Number, default: 1 },
        住宿: { type: Number, default: 1 },
        景點: { type: Number, default: 1 },
        證件: { type: Number, default: 1 },
        其他: { type: Number, default: 1 },
        恐怖故事: { type: Number, default: 1 },
        省錢妙招: { type: Number, default: 1 },
    },
    location_score: {
        亞洲: { type: Number, default: 1 },
        歐洲: { type: Number, default: 1 },
        非洲: { type: Number, default: 1 },
        北美洲: { type: Number, default: 1 },
        大洋洲: { type: Number, default: 1 },
        南美洲: { type: Number, default: 1 },
        南極洲: { type: Number, default: 1 },
    },
    type_pre: {
        省錢妙招: { type: Number, default: 1.6 },
        交通: { type: Number, default: 1.4 },
        住宿: { type: Number, default: 1.2 },
        景點: { type: Number, default: 1 },
        證件: { type: Number, default: 0.8 },
        恐怖故事: { type: Number, default: 0.6 },
        其他: { type: Number, default: 0.4 },
    },
    location_pre: {
        亞洲: { type: Number, default: 1.6 },
        歐洲: { type: Number, default: 1.4 },
        北美洲: { type: Number, default: 1.2 },
        大洋洲: { type: Number, default: 1 },
        南美洲: { type: Number, default: 0.8 },
        非洲: { type: Number, default: 0.6 },
        南極洲: { type: Number, default: 0.4 },
    },
    posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post', default: [] }],
    saved_posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post', default: [] }],
    liked_posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post', default: [] }],
    visited: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Country',
            default: [],
        },
    ],
    join_date: { type: Date, default: Date.now, immutable: true },
    last_login: { type: Date, default: Date.now },
    notification: [
        {
            commentor: { type: String },
            postId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Post' },
            postTitle: { type: String },
            type: { type: String, enum: ['comment', 'like'] },
            commentAt: { type: Date, default: Date.now },
            content: { type: String },
            read: { type: Boolean, default: false },
            commenterImg: { type: String },
        },
    ],
});

export default mongoose.model('User', userSchema);
