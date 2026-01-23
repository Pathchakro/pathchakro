import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourse extends Document {
    title: string;
    description: string; // JSON string from Novel.sh
    banner: string;
    fee: number;
    lastDateRegistration: Date;
    classStartDate: Date;
    mode: 'online' | 'offline';
    totalClasses: number;
    instructor: mongoose.Schema.Types.ObjectId;
    students: mongoose.Schema.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const CourseSchema: Schema<ICourse> = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        banner: { type: String, required: true },
        fee: { type: Number, required: true },
        lastDateRegistration: { type: Date, required: true },
        classStartDate: { type: Date, required: true },
        mode: { type: String, enum: ['online', 'offline'], required: true },
        totalClasses: { type: Number, required: true },
        instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    { timestamps: true }
);

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export default Course;
