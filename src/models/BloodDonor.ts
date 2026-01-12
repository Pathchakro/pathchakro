import { Schema, model, models } from 'mongoose';

export interface IBloodDonor {
    _id: string;
    user: string;
    bloodGroup: string;
    location: string;
    phone: string;
    lastDonationDate?: Date;
    availableForDonation: boolean;
    willingToTravel: boolean;
    maxTravelDistance?: number; // in km
    medicallyEligible: boolean;
    notes?: string;
    createdAt: Date;
}

const BloodDonorSchema = new Schema<IBloodDonor>(
    {
        user: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
            required: true,
            index: true,
        },
        location: {
            type: String,
            required: true,
            index: true,
        },
        phone: {
            type: String,
            required: true,
        },
        lastDonationDate: Date,
        availableForDonation: {
            type: Boolean,
            default: true,
            index: true,
        },
        willingToTravel: {
            type: Boolean,
            default: false,
        },
        maxTravelDistance: {
            type: Number,
            min: 0,
            max: 100,
        },
        medicallyEligible: {
            type: Boolean,
            default: true,
        },
        notes: String,
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient searching
BloodDonorSchema.index({ bloodGroup: 1, location: 1, availableForDonation: 1 });

const BloodDonor = models.BloodDonor || model<IBloodDonor>('BloodDonor', BloodDonorSchema);

export default BloodDonor;
