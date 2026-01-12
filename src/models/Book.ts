import mongoose, { Schema, Model } from 'mongoose';
import { IBook } from '@/types';

const BookSchema = new Schema<IBook>(
    {
        title: {
            type: String,
            required: [true, 'Book title is required'],
            trim: true,
        },
        author: {
            type: String,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
        },
        publisher: {
            type: String,
            trim: true,
        },
        isbn: {
            type: String,
            unique: true,
            sparse: true,
        },
        category: [{
            type: String,
            trim: true,
        }],
        coverImage: {
            type: String,
            default: '',
        },
        pdfUrl: {
            type: String,
            default: '',
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        copies: {
            type: Number,
            default: 1,
            min: 0,
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId as any,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
BookSchema.index({ title: 'text', author: 'text' });
BookSchema.index({ category: 1 });
BookSchema.index({ averageRating: -1 });

const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);

export default Book;
