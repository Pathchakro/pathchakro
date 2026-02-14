import mongoose, { Schema, model, models } from 'mongoose';

export interface IAssignment {
    _id: string;
    teacher: string;
    team?: string;
    title: string;
    description: string;
    dueDate: Date;
    totalPoints: number;
    attachments: string[];
    status: 'draft' | 'published' | 'closed';
    submissions: Array<{
        student: string;
        submittedAt: Date;
        content: string;
        attachments: string[];
        grade?: number;
        feedback?: string;
        status: 'submitted' | 'graded' | 'late';
    }>;
    slug: string;
    createdAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        team: {
            type: mongoose.Schema.Types.ObjectId as any,
            ref: 'Team',
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Assignment title is required'],
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: [true, 'Assignment description is required'],
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required'],
            index: true,
        },
        totalPoints: {
            type: Number,
            required: true,
            min: 1,
            max: 1000,
        },
        attachments: [String],
        status: {
            type: String,
            enum: ['draft', 'published', 'closed'],
            default: 'published',
            index: true,
        },
        submissions: [
            {
                student: {
                    type: mongoose.Schema.Types.ObjectId as any,
                    ref: 'User',
                    required: true,
                },
                submittedAt: {
                    type: Date,
                    default: Date.now,
                },
                content: {
                    type: String,
                    required: true,
                },
                attachments: [String],
                grade: {
                    type: Number,
                    min: 0,
                },
                feedback: String,
                status: {
                    type: String,
                    enum: ['submitted', 'graded', 'late'],
                    default: 'submitted',
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
AssignmentSchema.index({ teacher: 1, createdAt: -1 });
AssignmentSchema.index({ team: 1, status: 1, dueDate: 1 });
AssignmentSchema.index({ status: 1, dueDate: 1 });

const Assignment = models.Assignment || model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
