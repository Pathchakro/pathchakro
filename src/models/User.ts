import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/types';

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false,
        },
        image: {
            type: String,
            default: '',
        },
        coverImage: {
            type: String,
            default: '',
        },
        bio: {
            type: String,
            default: '',
        },
        profileType: {
            type: String,
            enum: ['Student', 'Tutor', 'Regular'],
            default: 'Regular',
        },
        university: {
            type: String,
            default: '',
        },
        thana: {
            type: String,
            default: '',
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''],
            default: '',
        },
        willingToDonateBlood: {
            type: Boolean,
            default: true,
        },
        lastDateOfDonateBlood: Date,
        bookPreferences: [{
            type: String,
        }],
        rank: {
            type: Number,
            default: 0,
        },
        rankTier: {
            type: String,
            enum: ['Beginner', 'Reader', 'Critic', 'Scholar', 'Master'],
            default: 'Beginner',
        },
        followers: [{
            type: Schema.Types.ObjectId as any,
            ref: 'User',
        }],
        following: [{
            type: Schema.Types.ObjectId as any,
            ref: 'User',
        }],
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
            index: true,
        },
        title: { type: String, trim: true },
        location: { type: String, trim: true },
        website: { type: String, trim: true },
        dateOfBirth: Date,
        phone: { type: String, trim: true },
        whatsappNumber: { type: String, trim: true },

        academic: {
            currentEducation: String,
            institution: String,
            degree: String,
            fieldOfStudy: String,
            graduationYear: Number,
            gpa: Number,
        },

        career: {
            currentPosition: String,
            company: String,
            industry: String,
            yearsOfExperience: Number,
            skills: [String],
            cvLink: String,
        },

        social: {
            linkedin: String,
            github: String,
            twitter: String,
        },

        interests: [String],
        languages: [String],

        address: {
            present: {
                division: String,
                addressLine: String,
                postCode: String,
                thana: String,
                postOffice: String,
                district: String,
            },
            permanent: {
                division: String,
                addressLine: String,
                postCode: String,
                thana: String,
                postOffice: String,
                district: String,
            },
        },

        verification: {
            isVerified: { type: Boolean, default: false },
            documentUrls: [String],
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected', 'none'],
                default: 'none',
            },
            submittedAt: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance

UserSchema.index({ rank: -1 });
UserSchema.index({ thana: 1 });
UserSchema.index({ university: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
