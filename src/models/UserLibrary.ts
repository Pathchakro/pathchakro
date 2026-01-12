import { Schema, model, models, Types } from 'mongoose';

export interface IUserLibrary {
    _id: string;
    user: Types.ObjectId | string;
    book: Types.ObjectId | string;
    status: 'want-to-read' | 'reading' | 'completed';
    isOwned: boolean;
    addedAt: Date;
    startedReading?: Date;
    completedReading?: Date;
    personalRating?: number;
    personalNotes?: string;
}

const UserLibrarySchema = new Schema<IUserLibrary>(
    {
        user: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        book: {
            type: Schema.Types.ObjectId as any,
            ref: 'Book',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['want-to-read', 'reading', 'completed'],
            default: 'want-to-read',
            index: true,
        },
        isOwned: {
            type: Boolean,
            default: false,
            index: true,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
        startedReading: Date,
        completedReading: Date,
        personalRating: {
            type: Number,
            min: 1,
            max: 5,
        },
        personalNotes: String,
    },
    {
        timestamps: true,
    }
);

// Compound index for unique user-book combination
UserLibrarySchema.index({ user: 1, book: 1 }, { unique: true });

const UserLibrary = models.UserLibrary || model<IUserLibrary>('UserLibrary', UserLibrarySchema);

export default UserLibrary;
