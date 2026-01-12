import { Schema, model, models } from 'mongoose';

export interface IOrder {
    _id: string;
    buyer: string;
    seller: string;
    product: string;
    quantity: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    buyerPhone: string;
    deliveryAddress: string;
    notes?: string;
    createdAt: Date;
    completedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
    {
        buyer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        buyerPhone: {
            type: String,
            required: true,
        },
        deliveryAddress: {
            type: String,
            required: true,
        },
        notes: String,
        completedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
OrderSchema.index({ buyer: 1, status: 1, createdAt: -1 });
OrderSchema.index({ seller: 1, status: 1, createdAt: -1 });

const Order = models.Order || model<IOrder>('Order', OrderSchema);

export default Order;
