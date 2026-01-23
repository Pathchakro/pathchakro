import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Enrollment from '@/models/Enrollment';
import TourBooking from '@/models/TourBooking';
import Course from '@/models/Course'; // Register Course schema
import Tour from '@/models/Tour';     // Register Tour schema

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        // Check for admin role - assuming 'admin'.Adjust if strictly verifying role field.
        if (!session?.user?.id) { /* && session.user.role === 'admin' */
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Ensure models are registered
        console.log('Registered Models:', Course.modelName, Tour.modelName);

        // 1. Fetch Donations
        // Assuming Transaction model has type='donation'
        const donations = await Transaction.find({ type: 'donation' })
            .select('amount status paymentMethod transactionId createdAt donorName proofOfPayment buyer')
            .populate('buyer', 'name email image')
            .sort({ createdAt: -1 })
            .lean();

        // 2. Fetch Course Enrollments
        const enrollments = await Enrollment.find({})
            .populate('student', 'name email image')
            .populate('course', 'title')
            .sort({ createdAt: -1 })
            .lean();

        // 3. Fetch Tour Bookings
        const bookings = await TourBooking.find({})
            .populate('user', 'name email image')
            .populate('tour', 'title')
            .sort({ createdAt: -1 })
            .lean();

        // 4. normalize
        const unifiedTransactions = [
            ...donations.map((d: any) => ({
                id: d._id,
                type: 'donation',
                source: 'General Fund',
                amount: d.amount,
                user: {
                    name: d.donorName || d.buyer?.name || 'Anonymous',
                    email: d.buyer?.email,
                    image: d.buyer?.image
                },
                payment: {
                    method: d.paymentMethod,
                    trxId: d.transactionId,
                    proof: d.proofOfPayment
                },
                status: d.status,
                date: d.createdAt
            })),
            ...enrollments.map((e: any) => ({
                id: e._id,
                type: 'course',
                source: e.course?.title || 'Unknown Course',
                amount: e.amount,
                user: {
                    name: e.student?.name || 'Unknown',
                    email: e.student?.email,
                    image: e.student?.image
                },
                payment: {
                    method: e.paymentDetails?.method,
                    trxId: e.paymentDetails?.transactionId,
                    proof: e.paymentDetails?.proofUrl
                },
                status: e.paymentStatus, // 'pending' | 'completed' | 'rejected'
                date: e.createdAt
            })),
            ...bookings.map((b: any) => ({
                id: b._id,
                type: 'tour',
                source: b.tour?.title || 'Unknown Tour',
                amount: b.amount,
                user: {
                    name: b.user?.name || 'Unknown',
                    email: b.user?.email,
                    image: b.user?.image
                },
                payment: {
                    method: b.paymentDetails?.method,
                    trxId: b.paymentDetails?.transactionId,
                    proof: b.paymentDetails?.proofUrl
                },
                status: b.paymentStatus,
                date: b.createdAt
            }))
        ];

        // Sort combined list by date desc
        unifiedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 5. Calculate Totals (Only collected/completed/approved ones)
        const stats = {
            totalFund: 0,
            donation: 0,
            course: 0,
            tour: 0
        };

        unifiedTransactions.forEach(t => {
            // Check status. For donation 'completed', for others 'completed'.
            // Note: In Donation model, we used 'completed' for paid.
            if (t.status === 'completed' || t.status === 'approved' || t.status === 'confirmed') {
                // Adjust status check based on model enums
                // Donation: pending, completed, failed
                // Enrollment: pending, completed, rejected
                // TourBooking: pending, completed, failed
                stats.totalFund += t.amount || 0;
                if (t.type === 'donation') stats.donation += t.amount || 0;
                if (t.type === 'course') stats.course += t.amount || 0;
                if (t.type === 'tour') stats.tour += t.amount || 0;
            }
        });

        return NextResponse.json({
            summary: stats,
            transactions: unifiedTransactions
        });

    } catch (error) {
        console.error('Unified Fund Error:', error);
        return NextResponse.json({ error: 'Failed to load fund data' }, { status: 500 });
    }
}
