import dbConnect from './mongodb';
import Transaction from '@/models/Transaction';

interface TransactionData {
    type: 'marketplace_sale' | 'book_sale' | 'writing_sale' | 'donation' | 'subscription';
    category: 'product' | 'book' | 'writing' | 'other';
    buyer?: string;
    seller?: string;
    itemId?: string;
    itemName: string;
    amount: number;
    platformFeePercentage?: number; // default 10%
    paymentMethod?: string;
}

/**
 * Record a transaction in the database
 * Automatically calculates platform fee and seller earnings
 */
export async function recordTransaction(data: TransactionData) {
    await dbConnect();

    const platformFeePercentage = data.platformFeePercentage || 10; // 10% default
    const platformFee = (data.amount * platformFeePercentage) / 100;
    const sellerEarnings = data.amount - platformFee;

    const transaction = await Transaction.create({
        type: data.type,
        category: data.category,
        buyer: data.buyer,
        seller: data.seller,
        itemId: data.itemId,
        itemName: data.itemName,
        amount: data.amount,
        platformFee,
        sellerEarnings,
        status: 'completed', // Can be 'pending' initially if needed
        paymentMethod: data.paymentMethod || 'cash',
    });

    return transaction;
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
    transactionId: string,
    status: 'pending' | 'completed' | 'refunded' | 'cancelled'
) {
    await dbConnect();

    const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        { status },
        { new: true }
    );

    return transaction;
}

/**
 * Get seller's total earnings
 */
export async function getSellerEarnings(sellerId: string) {
    await dbConnect();

    const result = await Transaction.aggregate([
        {
            $match: {
                seller: sellerId,
                status: 'completed',
            },
        },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$sellerEarnings' },
                totalSales: { $sum: 1 },
                totalRevenue: { $sum: '$amount' },
            },
        },
    ]);

    return result[0] || {
        totalEarnings: 0,
        totalSales: 0,
        totalRevenue: 0,
    };
}
