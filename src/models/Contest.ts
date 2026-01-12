import { Schema, model, models } from 'mongoose';

export interface IContest {
    _id: string;
    title: string;
    description: string;
    category: 'literature' | 'history' | 'language' | 'health' | 'technology';
    month: number; // 1-12
    year: number;
    startDate: Date;
    endDate: Date;
    status: 'upcoming' | 'active' | 'voting' | 'completed';
    prize: {
        first: string;
        second: string;
        third: string;
    };

    submissions: Array<{
        user: string;
        title: string;
        content: string;
        wordCount: number;
        submittedAt: Date;
        votes: number;
        voters: string[];
    }>;

    winners: {
        first?: {
            user: string;
            submission: number; // index in submissions array
            prize: string;
        };
        second?: {
            user: string;
            submission: number;
            prize: string;
        };
        third?: {
            user: string;
            submission: number;
            prize: string;
        };
    };

    createdAt: Date;
}

const ContestSchema = new Schema<IContest>(
    {
        title: {
            type: String,
            required: [true, 'Contest title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ['literature', 'history', 'language', 'health', 'technology'],
            required: true,
            index: true,
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
            index: true,
        },
        year: {
            type: Number,
            required: true,
            index: true,
        },
        startDate: {
            type: Date,
            required: true,
            index: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['upcoming', 'active', 'voting', 'completed'],
            default: 'upcoming',
            index: true,
        },
        prize: {
            first: {
                type: String,
                required: true,
            },
            second: {
                type: String,
                required: true,
            },
            third: {
                type: String,
                required: true,
            },
        },
        submissions: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                title: {
                    type: String,
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
                wordCount: {
                    type: Number,
                    required: true,
                },
                submittedAt: {
                    type: Date,
                    default: Date.now,
                },
                votes: {
                    type: Number,
                    default: 0,
                },
                voters: [{
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                }],
            },
        ],
        winners: {
            first: {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                submission: Number,
                prize: String,
            },
            second: {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                submission: Number,
                prize: String,
            },
            third: {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                submission: Number,
                prize: String,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
ContestSchema.index({ category: 1, year: 1, month: 1 });
ContestSchema.index({ status: 1, endDate: 1 });
ContestSchema.index({ year: 1, month: 1 });

const Contest = models.Contest || model<IContest>('Contest', ContestSchema);

export default Contest;
