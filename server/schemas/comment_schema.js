import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const commentSchema = new Schema({
    postId: { type: mongoose.SchemaTypes.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
    content: { type: String, required: [true, 'Write some content.'] },
    timestamp: { type: Date, default: Date.now, immutable: true },
});

export default mongoose.model('Comment', commentSchema);
