import { Schema, model, models } from 'mongoose';

export interface ITransaction {
    _id: string;
    type: 'marketplace_sale' | 'book_sale' | 'writing_sale' | 'donation' | 'subscription';
    category: 'product' | 'book' | 'writing' | 'other';
    buyer?: string;
    seller?: string;
    itemId?: string;
    itemName: string;
    amount: number;
    platformFee: number;
    sellerEarnings: number;
    status: 'pending' | 'completed' | 'refunded' | 'cancelled';
    paymentMethod?: string;
    proofOfPayment?: string;
    transactionId?: string;
    mobileNumber?: string;
    accountNumber?: string;
    donorName?: string;
    createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        type: {
            type: String,
            enum: ['marketplace_sale', 'book_sale', 'writing_sale', 'donation', 'subscription'],
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: ['product', 'book', 'writing', 'other'],
            required: true,
            index: true,
        },
        buyer: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            index: true,
        },
        seller: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            index: true,
        },
        itemId: Schema.Types.ObjectId,
        itemName: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        platformFee: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        sellerEarnings: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'refunded', 'cancelled'],
            default: 'pending',
            index: true,
        },
        paymentMethod: String,
        proofOfPayment: String,
        transactionId: String,
        mobileNumber: String,
        accountNumber: String,
        donorName: String,
    },
    {
        timestamps: true,
    }
);

// Indexes for analytics queries
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ seller: 1, status: 1 });

const Transaction = models.Transaction || model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
