import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IMigrationResults extends Document {
    action: string;
    operatorId: string;
    results: any[];
    createdAt: Date;
    updatedAt: Date;
}

const MigrationResultsSchema = new Schema<IMigrationResults>(
    {
        action: {
            type: String,
            required: true,
            index: true,
        },
        operatorId: {
            type: String, // String ID from session.user.id
            required: true,
            index: true,
        },
        results: {
            type: [Schema.Types.Mixed],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const MigrationResults = models.MigrationResults || model<IMigrationResults>('MigrationResults', MigrationResultsSchema);

export default MigrationResults;
