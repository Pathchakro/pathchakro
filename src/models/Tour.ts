import mongoose, { Schema, model, models } from 'mongoose';

export interface ITour {
    _id: string;
    organizer: mongoose.Types.ObjectId;
    title: string;
    destination: string;
    description: string;
    startDate: Date;
    endDate: Date;
    departureLocation: string;
    bannerUrl?: string;
    budget: number;
    participants: Array<{
        user: mongoose.Types.ObjectId;
        status: 'confirmed' | 'pending' | 'declined';
        joinedAt: Date;
    }>;
    itinerary: Array<{
        day: number;
        title: string;
        description: string;
        location?: string;
    }>;
    images: string[];
    videos: string[];
    privacy: 'public' | 'private' | 'team';
    team?: mongoose.Types.ObjectId;
    status: 'planning' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
    createdAt: Date;
}

const TourSchema = new Schema<ITour>(
    {
        organizer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Tour title is required'],
            trim: true,
        },
        destination: {
            type: String,
            required: [true, 'Destination is required'],
            index: true,
        },
        departureLocation: {
            type: String,
            required: [true, 'Departure location is required'],
        },
        bannerUrl: {
            type: String,
        },
        description: {
            type: String,
            required: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
            index: true,
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        budget: {
            type: Number,
            required: true,
            min: 0,
        },
        participants: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                status: {
                    type: String,
                    enum: ['confirmed', 'pending', 'declined'],
                    default: 'pending',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        itinerary: [
            {
                day: {
                    type: Number,
                    required: true,
                },
                title: {
                    type: String,
                    required: true,
                },
                description: {
                    type: String,
                    required: true,
                },
                location: String,
            },
        ],
        images: [String],
        videos: [String],
        privacy: {
            type: String,
            enum: ['public', 'private', 'team'],
            default: 'public',
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: 'Team',
        },
        status: {
            type: String,
            enum: ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'],
            default: 'planning',
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
TourSchema.index({ startDate: 1, status: 1 });
TourSchema.index({ destination: 1, status: 1 });
TourSchema.index({ organizer: 1, createdAt: -1 });

const Tour = models.Tour || model<ITour>('Tour', TourSchema);

export default Tour;
