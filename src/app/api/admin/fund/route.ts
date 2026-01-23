import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Transaction from '@/models/Transaction';
import FundApplication from '@/models/FundApplication';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        // Check for admin role - assuming email check or role check. 
        // Adapting to existing patterns, likely checking if user exists and has role (if role system exists)
        // or just strict session check + admin email match? 
        // For now, doing basic session check. Ideally should check isAdmin.
        // Assuming user model has role: 'admin' or strict email list.
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Security check: Verify if the user is an admin.
        const user = await User.findOne({ email: session.user.email });
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
        }

        // Fetch Donations (Transactions of type 'donation')
        const donations = await Transaction.find({ type: 'donation' })
            .sort({ createdAt: -1 })
            .populate('buyer', 'name email image') // Populate Donor info
            .lean();

        // Fetch Applications
        const applications = await FundApplication.find({})
            .sort({ createdAt: -1 })
            .populate('applicant', 'name email image')
            .lean();

        return NextResponse.json({
            donations,
            applications
        });

    } catch (error) {
        console.error('Admin Fund Fetch Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch fund data' },
            { status: 500 }
        );
    }
}
