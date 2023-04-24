import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const postSchema = new Schema({
    title: { type: String, required: [true, 'Please fill the title.'], maxLength: 100 },
    authorId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    main_image: { type: String },
    location: {
        continent: {
            type: String,
            default: null,
            enum: ['亞洲', '歐洲', '北美洲', '大洋洲', '南美洲', '非洲', '南極洲'],
        },
        country: { type: String, default: null },
        city: { type: String, default: null },
    },
    type: {
        type: String,
        default: null,
        enum: ['交通', '住宿', '景點', '證件', '其他', '恐怖故事', '省錢妙招'],
    },

    content: { type: String, required: [true, 'Write some content.'] },
    dates: {
        post_date: { type: Date, default: Date.now, immutable: true },
        start_date: { type: Date, default: Date.now },
        end_date: { type: Date, default: Date.now },
        last_interact: { type: Date, default: Date.now },
    },
    comments: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Comment' }],
    new_read_num: { type: Number, default: 0 },
    read_num: { type: Number, default: 10 },
    new_like_num: { type: Number, default: 0 },
    like_num: { type: Number, default: 0 },
    new_save_num: { type: Number, default: 0 },
    save_num: { type: Number, default: 0 },
    new_comment_num: { type: Number, default: 0 },
    comment_num: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
});

export default mongoose.model('Post', postSchema);
