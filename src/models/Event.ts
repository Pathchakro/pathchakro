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
    banner?: string;
    slug: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    privacy: 'public' | 'private' | 'team';

    // Role-based participants
    roles: {
        speakers: Array<{
            user: string;
            topic: string;
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
        banner: {
            type: String,
        },
        slug: {
            type: String,
            unique: true,
            sparse: true,
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
            default: 'upcoming',
            index: true,
        },
        privacy: {
            type: String,
            enum: ['public', 'private', 'team'],
            default: 'public',
        },
        roles: {
            speakers: [
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
                    required: true,
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
        strictPopulate: false,
        suppressReservedKeysWarning: true,
    } as any
);

EventSchema.pre('validate', function(this: IEvent) {
    if (this.privacy === 'team' && !this.team) {
        throw new Error('Team is required for team-only events');
    }
});

// Pre-save hook to generate slug
// Pre-save hook removed - Slug generation is now handled in the controller using generateUniqueSlug

// Indexes for efficient querying
EventSchema.index({ startTime: 1, status: 1 });
EventSchema.index({ team: 1, privacy: 1, status: 1, startTime: 1 });
EventSchema.index({ organizer: 1, createdAt: -1 });

// Prevent overwrite warning in development
if (process.env.NODE_ENV === 'development') {
    if (models.Event) {
        delete models.Event;
    }
}

const Event = models.Event || model<IEvent>('Event', EventSchema);

export default Event;
