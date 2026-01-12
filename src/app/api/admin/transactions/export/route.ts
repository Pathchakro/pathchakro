import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const formatType = searchParams.get('format') || 'csv';

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end day

        const transactions = await Transaction.find({
            createdAt: { $gte: start, $lte: end },
        })
            .populate('buyer', 'name email')
            .populate('seller', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // Generate CSV content
        const headers = [
            'Date',
            'Transaction ID',
            'Item',
            'Type',
            'Category',
            'Amount (BDT)',
            'Platform Fee (BDT)',
            'Seller Earnings (BDT)',
            'Buyer',
            'Seller',
            'Status',
        ].join(',');

        const rows = transactions.map((t: any) => {
            return [
                format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                t._id,
                t.itemName.replace(/,/g, ' '), // Remove commas to prevent CSV breakage
                t.type,
                t.category,
                t.amount,
                t.platformFee,
                t.sellerEarnings,
                t.buyer?.name || 'N/A',
                t.seller?.name || 'Platform',
                t.status,
            ].join(',');
        });

        const csvContent = [headers, ...rows].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="transactions_${startDate}_to_${endDate}.csv"`,
            },
        });

    } catch (error: any) {
        console.error('Error exporting transactions:', error);
        return NextResponse.json(
            { error: 'Failed to export transactions' },
            { status: 500 }
        );
    }
}
