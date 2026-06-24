import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEnrollment extends Document {
    course: mongoose.Types.ObjectId | string;
    student: mongoose.Types.ObjectId | string;
    paymentStatus: 'pending' | 'completed' | 'rejected';
    paymentDetails: {
        method: string;
        transactionId?: string;
        mobileNumber?: string;
        proofUrl?: string;
    };
    amount: number;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}

const EnrollmentSchema: Schema<IEnrollment> = new Schema(
    {
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'rejected'],
            default: 'pending'
        },
        paymentDetails: {
            method: { type: String, required: true },
            transactionId: { type: String },
            mobileNumber: { type: String },
            proofUrl: { type: String }
        },
        amount: { type: Number, required: true },
        name: { type: String },
        phone: { type: String },
        email: { type: String },
        address: { type: String }
    },
    { timestamps: true }
);

const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export default Enrollment;
