import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Transaction from '@/models/Transaction';
import FundApplication from '@/models/FundApplication';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Admin Check
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const { type, id, action } = await req.json();

        if (!id || !action || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (type === 'donation') {
            const transaction = await Transaction.findById(id);
            if (!transaction) {
                return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
            }

            if (action === 'approve') {
                transaction.status = 'completed';
            } else if (action === 'reject') {
                transaction.status = 'failed'; // Or 'rejected' if enum supports it. Assuming 'failed' as per typical payment flows or adding 'rejected' to enum.
                // Standardizing on 'failed' for now unless enum changed. 
                // Let's assume 'failed' equates to rejected for donations.
            } else {
                return NextResponse.json({ error: 'Invalid action for donation' }, { status: 400 });
            }
            await transaction.save();
        } else if (type === 'application') {
            const application = await FundApplication.findById(id);
            if (!application) {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 });
            }

            if (action === 'approve') {
                application.status = 'approved';
            } else if (action === 'reject') {
                application.status = 'rejected';
            } else if (action === 'disburse') {
                // When disbursed, we might want to create a transaction record of type 'expense' or similar to track money leaving?
                // For now, just updating status.
                application.status = 'disbursed';
            } else {
                return NextResponse.json({ error: 'Invalid action for application' }, { status: 400 });
            }
            await application.save();
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `Successfully ${action}ed` });

    } catch (error) {
        console.error('Admin Fund Action Error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
