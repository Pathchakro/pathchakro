import { Schema, model, models } from 'mongoose';

export interface IBloodRequest {
    _id: string;
    requester: string;
    patientName: string;
    bloodType: string;
    unitsNeeded: number;
    urgency: 'critical' | 'urgent' | 'normal';
    location: string;
    hospital: string;
    contactNumber: string;
    additionalInfo?: string;
    status: 'active' | 'fulfilled' | 'expired';
    expiresAt: Date;
    createdAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
    {
        requester: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        patientName: {
            type: String,
            required: [true, 'Patient name is required'],
        },
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
            required: [true, 'Blood type is required'],
            index: true,
        },
        unitsNeeded: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
        },
        urgency: {
            type: String,
            enum: ['critical', 'urgent', 'normal'],
            default: 'normal',
            index: true,
        },
        location: {
            type: String,
            required: [true, 'Location is required'],
            index: true,
        },
        hospital: {
            type: String,
            required: [true, 'Hospital name is required'],
        },
        contactNumber: {
            type: String,
            required: [true, 'Contact number is required'],
        },
        additionalInfo: {
            type: String,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ['active', 'fulfilled', 'expired'],
            default: 'active',
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
BloodRequestSchema.index({ status: 1, urgency: -1, createdAt: -1 });
BloodRequestSchema.index({ bloodType: 1, location: 1, status: 1 });

const BloodRequest = models.BloodRequest || model<IBloodRequest>('BloodRequest', BloodRequestSchema);

export default BloodRequest;
