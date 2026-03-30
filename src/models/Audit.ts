import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IAudit extends Document {
    action: string;
    operator: mongoose.Types.ObjectId;
    target?: string;
    details: any;
    status: 'success' | 'failure';
    timestamp: Date;
}

const AuditSchema = new Schema<IAudit>(
    {
        action: {
            type: String,
            required: true,
            index: true,
        },
        operator: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        target: {
            type: String,
        },
        details: {
            type: Schema.Types.Mixed,
        },
        status: {
            type: String,
            enum: ['success', 'failure'],
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Audit = models.Audit || model<IAudit>('Audit', AuditSchema);

export default Audit;
