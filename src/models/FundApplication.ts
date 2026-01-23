import { Schema, model, models } from 'mongoose';

export interface IFundApplication {
    _id: string;
    applicant: string; // User ID
    title: string;
    description: object; // JSON content from Novel Editor
    amountRequested: number;
    status: 'pending' | 'approved' | 'rejected' | 'disbursed';
    createdAt: Date;
    updatedAt: Date;
}

const FundApplicationSchema = new Schema<IFundApplication>(
    {
        applicant: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: Schema.Types.Mixed, // Storing JSON content
            required: true,
        },
        amountRequested: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'disbursed'],
            default: 'pending',
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const FundApplication = models.FundApplication || model<IFundApplication>('FundApplication', FundApplicationSchema);

export default FundApplication;
