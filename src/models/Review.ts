import mongoose, { Schema, Model } from 'mongoose';
import { IReview } from '@/types';

const ReviewSchema = new Schema(
    {
        book: {
            type: Schema.Types.ObjectId as any,
            ref: 'Book',
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            required: [true, 'Review title is required'],
            maxlength: [70, 'Title cannot be more than 70 characters'],
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        content: {
            type: String,
            required: [true, 'Review content is required'],
        },
        tags: [{
            type: String,
        }],
        videoUrl: {
            type: String,
        },
        image: {
            type: String,
        },
        helpful: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ReviewSchema.index({ book: 1, user: 1 }, { unique: true });
ReviewSchema.index({ user: 1, createdAt: -1 });
ReviewSchema.index({ book: 1, createdAt: -1 });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
