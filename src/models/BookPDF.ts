import { Schema, model, models } from 'mongoose';

export interface IBookPDF {
    _id: string;
    book: string;
    uploadedBy: string;
    fileName: string;
    fileUrl: string;
    fileSize: number; // in bytes
    downloads: number;
    description?: string;
    createdAt: Date;
}

const BookPDFSchema = new Schema<IBookPDF>(
    {
        book: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
            index: true,
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        downloads: {
            type: Number,
            default: 0,
        },
        description: String,
    },
    {
        timestamps: true,
    }
);

// Indexes
BookPDFSchema.index({ book: 1, createdAt: -1 });

const BookPDF = models.BookPDF || model<IBookPDF>('BookPDF', BookPDFSchema);

export default BookPDF;
