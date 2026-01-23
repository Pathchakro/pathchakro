import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Transaction from '@/models/Transaction';
import dbConnect from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        await dbConnect();

        // 1. Total Balance (Sum of all completed donations)
        const totalBalanceResult = await Transaction.aggregate([
            {
                $match: {
                    type: 'donation',
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalBalance = totalBalanceResult[0]?.total || 0;

        // 2. Leaderboard (Top donors by total amount)
        const leaderboard = await Transaction.aggregate([
            {
                $match: {
                    type: 'donation',
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$donorName', // Group by name
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $sort: { totalAmount: -1 } // Highest first
            },
            {
                $limit: 10 // Top 10
            },
            {
                $project: {
                    _id: 0,
                    name: '$_id',
                    amount: '$totalAmount'
                }
            }
        ]);

        // 3. User History (if logged in)
        let userHistory = [];
        if (session?.user?.id) {
            userHistory = await Transaction.find({
                type: 'donation',
                buyer: session.user.id
            })
                .select('amount status createdAt paymentMethod transactionId donorName buyer')
                .populate('buyer', '_id name image')
                .sort({ createdAt: -1 })
                .limit(20);
        }

        return NextResponse.json({
            totalBalance,
            leaderboard,
            userHistory
        });

    } catch (error) {
        console.error('Fund Stats Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fund statistics' },
            { status: 500 }
        );
    }
}
