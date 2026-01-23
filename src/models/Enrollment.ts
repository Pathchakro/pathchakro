import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEnrollment extends Document {
    course: mongoose.Schema.Types.ObjectId;
    student: mongoose.Schema.Types.ObjectId;
    paymentStatus: 'pending' | 'completed' | 'rejected';
    paymentDetails: {
        method: string;
        transactionId?: string;
        mobileNumber?: string;
        proofUrl?: string;
    };
    amount: number;
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
        amount: { type: Number, required: true }
    },
    { timestamps: true }
);

const Enrollment: Model<IEnrollment> = mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
export default Enrollment;
