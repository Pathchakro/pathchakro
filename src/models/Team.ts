import mongoose, { Schema, Model } from 'mongoose';
import { ITeam } from '@/types';

const TeamSchema = new Schema<ITeam>(
    {
        name: {
            type: String,
            required: [true, 'Team name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Team description is required'],
        },
        slug: {
            type: String,
            unique: true,
            sparse: true, // Allow older docs to lack it for now or handle migration
            trim: true,
        },
        type: {
            type: String,
            enum: ['University', 'Thana', 'Special'],
            required: true,
        },
        university: {
            type: String,
            default: '',
        },
        location: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            default: 'General',
        },
        privacy: {
            type: String,
            enum: ['public', 'private'],
            default: 'public',
        },
        coverImage: {
            type: String,
            default: '',
        },
        logo: {
            type: String,
            default: '',
        },
        leader: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: false, // System created teams might wait for admin to assign leader
        },
        members: [{
            user: {
                type: Schema.Types.ObjectId as any,
                ref: 'User',
            },
            role: {
                type: String,
                enum: ['leader', 'deputy', 'member'],
                default: 'member',
            },
            joinedAt: {
                type: Date,
                default: Date.now,
            },
        }],
        joinRequests: [{
            user: {
                type: Schema.Types.ObjectId as any,
                ref: 'User',
            },
            requestedAt: {
                type: Date,
                default: Date.now,
            },
        }],
    },
    {
        timestamps: true,
    }
);

// Indexes
TeamSchema.index({ type: 1 });
TeamSchema.index({ 'members.user': 1 });

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
