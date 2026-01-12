import mongoose, { Schema, Model } from 'mongoose';
import { IComment } from '@/types';

const CommentSchema = new Schema<IComment>(
    {
        post: {
            type: Schema.Types.ObjectId as any,
            ref: 'Post',
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Comment content is required'],
        },
        replies: [{
            type: Schema.Types.ObjectId as any,
            ref: 'Comment',
        }],
        likes: [{
            type: Schema.Types.ObjectId as any,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

// Indexes
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
