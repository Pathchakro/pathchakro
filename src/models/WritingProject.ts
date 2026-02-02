import { Schema, model, models } from 'mongoose';

export interface IWritingProject {
    _id: string;
    author: string;
    title: string;
    slug?: string;
    coverImage?: string;
    introduction?: string;
    description?: string;
    category: string[];
    status: 'draft' | 'published';
    visibility: 'private' | 'public';
    chapters: Array<{
        _id: string;
        chapterNumber: number;
        title: string;
        slug: string;
        image?: string;
        content: string;
        wordCount: number;
        status: 'draft' | 'published';
        createdAt: Date;
        updatedAt: Date;
    }>;
    totalWords: number;
    totalChapters: number;
    forSale: boolean;
    salePrice?: number;
    saleType?: 'physical' | 'pdf' | 'both';
    createdAt: Date;
    updatedAt: Date;
}

const WritingProjectSchema = new Schema<IWritingProject>(
    {
        author: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Book title is required'],
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            sparse: true, // Allows null/missing for existing docs
            trim: true,
            index: true,
            validate: {
                validator: function (v: string) {
                    // Allow Unicode but disallow spaces and URL reserved chars
                    return /^[^\s\/\\?#]+$/.test(v);
                },
                message: (props: any) => `${props.value} contains invalid characters (spaces or /?# are not allowed)`
            }
        },
        coverImage: String,
        introduction: String,
        description: String,
        category: [{
            type: String,
            trim: true,
        }],
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
            index: true,
        },
        visibility: {
            type: String,
            enum: ['private', 'public'],
            default: 'private',
            index: true,
        },
        chapters: [{
            chapterNumber: {
                type: Number,
                required: true,
            },
            title: {
                type: String,
                required: true,
            },
            slug: {
                type: String,
                required: true,
            },
            image: String, // Optional chapter cover image
            content: {
                type: String,
                required: true,
            },
            wordCount: {
                type: Number,
                default: 0,
            },
            status: {
                type: String,
                enum: ['draft', 'published'],
                default: 'draft',
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            updatedAt: {
                type: Date,
                default: Date.now,
            },
        }],
        totalWords: {
            type: Number,
            default: 0,
        },
        totalChapters: {
            type: Number,
            default: 0,
        },
        forSale: {
            type: Boolean,
            default: false,
        },
        salePrice: Number,
        saleType: {
            type: String,
            enum: ['physical', 'pdf', 'both'],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
WritingProjectSchema.index({ author: 1, status: 1 });
WritingProjectSchema.index({ visibility: 1, status: 1 });

const WritingProject = models.WritingProject || model<IWritingProject>('WritingProject', WritingProjectSchema);

export default WritingProject;
