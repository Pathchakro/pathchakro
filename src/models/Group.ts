import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IGroup extends Document {
    name: string;
    type: string;
    members: mongoose.Types.ObjectId[];
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
    {
        name: {
            type: String,
            required: [true, 'Group name is required'],
            trim: true,
            unique: true,
        },
        type: {
            type: String,
            enum: ['thana', 'interest', 'institution', 'other'],
            default: 'thana',
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        description: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent error if model already exists
const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', GroupSchema);

export default Group;
