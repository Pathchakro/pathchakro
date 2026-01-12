import { Schema, model, models } from 'mongoose';

export interface IMessage {
    _id: string;
    sender: string;
    recipient: string;
    content: string;
    read: boolean;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        sender: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        recipient: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
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

// Compound indexes for efficient querying
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Message = models.Message || model<IMessage>('Message', MessageSchema);

export default Message;
