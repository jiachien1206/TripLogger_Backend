import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const countrySchema = new Schema({
    name: { cn: { type: String }, en: { type: String } },
    main_image: { type: String },
    capital: { type: String },
    coordinate: { type: Array },
    emoji: { type: String },
    iso2: { type: String },
    iso3: { type: String },
    continent: { type: String },
    region: { type: String },
    subregion: { type: String },
    phone_code: { type: String },
    currency: { type: String },
    posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post', default: [] }],
});

export default mongoose.model('Country', countrySchema);
