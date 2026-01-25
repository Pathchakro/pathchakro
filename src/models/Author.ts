import mongoose from 'mongoose';

const AuthorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for the author.'],
        unique: true,
        trim: true,
    },
    image: {
        type: String,
    },
    bio: {
        type: String,
    },
    slug: {
        type: String,
        unique: true,
    },
}, {
    timestamps: true,
});

export default mongoose.models.Author || mongoose.model('Author', AuthorSchema);
