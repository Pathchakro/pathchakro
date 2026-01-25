import mongoose from 'mongoose';

const InstituteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide an institute name'],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Institute || mongoose.model('Institute', InstituteSchema);
