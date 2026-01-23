import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITourBooking extends Document {
    tour: mongoose.Schema.Types.ObjectId;
    user: mongoose.Schema.Types.ObjectId; // The user who booked
    amount: number;
    bookingStatus: 'pending' | 'confirmed' | 'cancelled';
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentDetails: {
        method: string;
        transactionId?: string;
        mobileNumber?: string;
        proofUrl?: string;
    };
    seats: number;
    createdAt: Date;
    updatedAt: Date;
}

const TourBookingSchema: Schema<ITourBooking> = new Schema(
    {
        tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        bookingStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paymentDetails: {
            method: { type: String, required: true },
            transactionId: { type: String },
            mobileNumber: { type: String },
            proofUrl: { type: String }
        },
        seats: { type: Number, default: 1 }
    },
    { timestamps: true }
);

const TourBooking: Model<ITourBooking> = mongoose.models.TourBooking || mongoose.model<ITourBooking>('TourBooking', TourBookingSchema);
export default TourBooking;
