import { Schema, model, models } from 'mongoose';

export interface IEvent {
    _id: string;
    organizer: string;
    team?: string;
    title: string;
    description: string;
    eventType: 'online' | 'offline';
    location?: string;
    meetingLink?: string;
    startTime: Date;
    endTime: Date;
    banner?: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

    // Role-based participants
    roles: {
        host?: {
            user: string;
            assignedAt: Date;
        };
        anchor?: {
            user: string;
            assignedAt: Date;
        };
        summarizer?: {
            user: string;
            assignedAt: Date;
        };
        opener?: {
            user: string;
            assignedAt: Date;
        };
        closer?: {
            user: string;
            assignedAt: Date;
        };
        lecturers: Array<{
            user: string;
            topic: string;
            duration: number; // in minutes (default 2)
            order: number;
            assignedAt: Date;
        }>;
    };

    listeners: Array<{
        user: string;
        joinedAt: Date;
    }>;

    createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        organizer: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        team: {
            type: Schema.Types.ObjectId as any,
            ref: 'Team',
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Event description is required'],
        },
        eventType: {
            type: String,
            enum: ['online', 'offline'],
            required: true,
        },
        location: String,
        meetingLink: String,
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
            index: true,
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required'],
        },
        banner: {
            type: String,
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming',
            index: true,
        },
        roles: {
            host: {
                user: {
                    type: Schema.Types.ObjectId as any,
                    ref: 'User',
                },
                assignedAt: Date,
            },
            anchor: {
                user: {
                    type: Schema.Types.ObjectId as any,
                    ref: 'User',
                },
                assignedAt: Date,
            },
            summarizer: {
                user: {
                    type: Schema.Types.ObjectId as any,
                    ref: 'User',
                },
                assignedAt: Date,
            },
            opener: {
                user: {
                    type: Schema.Types.ObjectId as any,
                    ref: 'User',
                },
                assignedAt: Date,
            },
            closer: {
                user: {
                    type: Schema.Types.ObjectId as any,
                    ref: 'User',
                },
                assignedAt: Date,
            },
            lecturers: [
                {
                    user: {
                        type: Schema.Types.ObjectId as any,
                        ref: 'User',
                        required: true,
                    },
                    topic: {
                        type: String,
                        required: true,
                    },
                    duration: {
                        type: Number,
                        default: 2,
                        min: 1,
                        max: 10,
                    },
                    order: {
                        type: Number,
                        required: true,
                    },
                    assignedAt: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
        },
        listeners: [
            {
                user: {
                    type: Schema.Types.ObjectId as any,
                    ref: 'User',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
EventSchema.index({ startTime: 1, status: 1 });
EventSchema.index({ team: 1, status: 1, startTime: 1 });
EventSchema.index({ organizer: 1, createdAt: -1 });

const Event = models.Event || model<IEvent>('Event', EventSchema);

export default Event;
