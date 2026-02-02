import { Schema, model, models, Types } from 'mongoose';

export interface IReadingProgress {
    user: Types.ObjectId | string;
    project: Types.ObjectId | string;
    completedChapters: string[]; // Array of chapter IDs
    lastReadChapter?: string; // Chapter ID
    lastReadAt: Date;
}

const ReadingProgressSchema = new Schema<IReadingProgress>(
    {
        user: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        project: {
            type: Schema.Types.ObjectId as any,
            ref: 'WritingProject',
            required: true,
            index: true,
        },
        completedChapters: [{
            type: String, // Storing Chapter IDs
        }],
        lastReadChapter: String,
        lastReadAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique user-project combination
ReadingProgressSchema.index({ user: 1, project: 1 }, { unique: true });

const ReadingProgress = models.ReadingProgress || model<IReadingProgress>('ReadingProgress', ReadingProgressSchema);

export default ReadingProgress;
