import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const continentSchema = new Schema({
    countries: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Country' }],
    posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post' }],
});

export default mongoose.model('Continent', continentSchema);
