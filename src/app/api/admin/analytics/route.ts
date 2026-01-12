import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Product from '@/models/Product';
import Book from '@/models/Book';
import WritingProject from '@/models/WritingProject';
import Post from '@/models/Post';
import Team from '@/models/Team';

export async function GET(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30'; // days
        const daysAgo = parseInt(period);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Platform Statistics
        const [
            totalUsers,
            totalProducts,
            totalBooks,
            totalWritingProjects,
            totalPosts,
            totalTeams,
        ] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Book.countDocuments(),
            WritingProject.countDocuments(),
            Post.countDocuments(),
            Team.countDocuments(),
        ]);

        // Financial Statistics
        const transactionStats = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalPlatformFee: { $sum: '$platformFee' },
                    totalSellerEarnings: { $sum: '$sellerEarnings' },
                    totalTransactions: { $sum: 1 },
                },
            },
        ]);

        const financials = transactionStats[0] || {
            totalRevenue: 0,
            totalPlatformFee: 0,
            totalSellerEarnings: 0,
            totalTransactions: 0,
        };

        // Sales by Category
        const salesByCategory = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: '$category',
                    revenue: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Revenue by Type
        const revenueByType = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: '$type',
                    revenue: { $sum: '$amount' },
                    platformFee: { $sum: '$platformFee' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Recent Transactions
        const recentTransactions = await Transaction.find({ status: 'completed' })
            .populate('buyer', 'name email')
            .populate('seller', 'name email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Daily Revenue (last 30 days)
        const dailyRevenue = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    revenue: { $sum: '$amount' },
                    platformFee: { $sum: '$platformFee' },
                    transactions: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        return NextResponse.json({
            period: `Last ${daysAgo} days`,
            platformStats: {
                totalUsers,
                totalProducts,
                totalBooks,
                totalWritingProjects,
                totalPosts,
                totalTeams,
            },
            financials: {
                totalRevenue: financials.totalRevenue,
                totalPlatformFee: financials.totalPlatformFee,
                totalSellerEarnings: financials.totalSellerEarnings,
                totalTransactions: financials.totalTransactions,
                averageTransactionValue: financials.totalTransactions > 0
                    ? financials.totalRevenue / financials.totalTransactions
                    : 0,
            },
            salesByCategory,
            revenueByType,
            recentTransactions,
            dailyRevenue,
        });
    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
