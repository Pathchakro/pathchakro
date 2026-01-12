import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';

export async function GET(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const matchStage = {
            status: 'completed',
            createdAt: { $gte: start, $lte: end },
        };

        // Calculate totals
        const totals = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalPlatformProfit: { $sum: '$platformFee' },
                    totalSellerPayout: { $sum: '$sellerEarnings' },
                    transactionCount: { $sum: 1 },
                },
            },
        ]);

        // Calculate profit trend over time
        const profitTrend = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    profit: { $sum: '$platformFee' },
                    revenue: { $sum: '$amount' },
                    payouts: { $sum: '$sellerEarnings' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Fill in missing dates for complete chart data
        const days = eachDayOfInterval({ start, end });
        const trendData = days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const found = profitTrend.find((item: any) => item._id === dateStr);
            return {
                date: dateStr,
                profit: found?.profit || 0,
                revenue: found?.revenue || 0,
                payouts: found?.payouts || 0,
            };
        });

        return NextResponse.json({
            summary: totals[0] || {
                totalRevenue: 0,
                totalPlatformProfit: 0,
                totalSellerPayout: 0,
                transactionCount: 0,
            },
            trend: trendData,
        });
    } catch (error: any) {
        console.error('Error fetching profit analysis:', error);
        return NextResponse.json(
            { error: 'Failed to fetch profit analysis' },
            { status: 500 }
        );
    }
}
