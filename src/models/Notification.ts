import { Schema, model, models } from 'mongoose';

export interface INotification {
    _id: string;
    recipient: string;
    sender: string;
    type: 'like' | 'comment' | 'reply' | 'follow' | 'team_invite' | 'team_join' | 'mention' | 'review_helpful';
    post?: string;
    comment?: string;
    team?: string;
    review?: string;
    message: string;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipient: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['like', 'comment', 'reply', 'follow', 'team_invite', 'team_join', 'mention', 'review_helpful'],
            required: true,
        },
        post: {
            type: Schema.Types.ObjectId as any,
            ref: 'Post',
        },
        comment: {
            type: Schema.Types.ObjectId as any,
            ref: 'Comment',
        },
        team: {
            type: Schema.Types.ObjectId as any,
            ref: 'Team',
        },
        review: {
            type: Schema.Types.ObjectId as any,
            ref: 'Review',
        },
        message: {
            type: String,
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);

export default Notification;
