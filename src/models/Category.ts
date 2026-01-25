import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
    },
    type: {
        type: String,
        default: 'book_category', // Can be 'interest', 'book', 'movie', etc.
    }
}, {
    timestamps: true,
});

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
