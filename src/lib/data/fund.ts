import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import FundApplication from '@/models/FundApplication';

/**
 * Fetch global fund statistics (Balance & Leaderboard)
 */
const getCachedGlobalFundStats = unstable_cache(
    async () => {
        try {
            await dbConnect();
            
            // 1. Get total donations from completed donation transactions
            const totalDonations = await Transaction.aggregate([
                { $match: { type: 'donation', status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            // 2. Get total spent from disbursed fund applications
            const totalSpent = await FundApplication.aggregate([
                { $match: { status: 'disbursed' } },
                { $group: { _id: null, total: { $sum: '$amountRequested' } } }
            ]);

            const balance = (totalDonations[0]?.total || 0) - (totalSpent[0]?.total || 0);

            // 3. Get Donation Leaderboard
            const leaderboard = await Transaction.aggregate([
                { $match: { type: 'donation', status: 'completed' } },
                { $group: { _id: '$donorName', amount: { $sum: '$amount' } } },
                { $sort: { amount: -1 } },
                { $limit: 10 },
                { $project: { name: '$_id', amount: 1, _id: 0 } }
            ]);

            return {
                totalBalance: balance,
                leaderboard: JSON.parse(JSON.stringify(leaderboard))
            };
        } catch (error) {
            console.error('Error fetching global fund stats:', error);
            return { totalBalance: 0, leaderboard: [] };
        }
    },
    ['fund-stats-global'],
    {
        tags: ['fund'],
        revalidate: 3600
    }
);

/**
 * Fetch specific user's donation history
 */
const getCachedUserFundHistory = (userId: string) => unstable_cache(
    async () => {
        try {
            await dbConnect();
            
            const history = await Transaction.find({ buyer: userId, type: 'donation', status: 'completed' })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            return JSON.parse(JSON.stringify(history));
        } catch (error) {
            console.error(`Error fetching fund history for user ${userId}:`, error);
            return [];
        }
    },
    ['fund-user-history', userId],
    {
        tags: ['fund'],
        revalidate: 3600
    }
)();

/**
 * Unified export to fetch both global and user-specific fund data
 */
export const getCachedFundStats = async (userId?: string) => {
    try {
        const [globalStats, userHistory] = await Promise.all([
            getCachedGlobalFundStats(),
            userId ? getCachedUserFundHistory(userId) : Promise.resolve([])
        ]);

        return {
            ...globalStats,
            userHistory
        };
    } catch (error) {
        console.error('Error in getCachedFundStats:', error);
        return {
            totalBalance: 0,
            leaderboard: [],
            userHistory: []
        };
    }
};
