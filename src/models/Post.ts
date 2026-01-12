import mongoose, { Schema, Model } from 'mongoose';
import { IPost } from '@/types';

const PostSchema = new Schema<IPost>(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
        },
        type: {
            type: String,
            enum: ['text', 'photo', 'video', 'review', 'quiz', 'assignment', 'poll'],
            default: 'text',
        },
        media: [{
            type: String,
        }],
        videoUrl: {
            type: String,
        },
        privacy: {
            type: String,
            enum: ['public', 'friends', 'team'],
            default: 'public',
        },
        likes: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        comments: [{
            type: Schema.Types.ObjectId,
            ref: 'Comment',
        }],
        shares: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ type: 1 });
PostSchema.index({ createdAt: -1 });

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
