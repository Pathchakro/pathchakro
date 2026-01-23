import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Enrollment from '@/models/Enrollment';
import TourBooking from '@/models/TourBooking';
import Course from '@/models/Course';
import Tour from '@/models/Tour';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, id, action } = await req.json(); // type: 'donation' | 'course' | 'tour'

        await dbConnect();

        let updatedStatus = '';
        if (action === 'approve') updatedStatus = 'completed';
        else if (action === 'reject') updatedStatus = action === 'reject' ? 'failed' : 'rejected';
        // Normalize status: donations use 'failed', others might use 'rejected'. 
        // Let's stick to 'completed' for success.

        if (type === 'donation') {
            const status = action === 'approve' ? 'completed' : 'failed';
            await Transaction.findByIdAndUpdate(id, { status });
        }
        else if (type === 'course') {
            const status = action === 'approve' ? 'completed' : 'rejected';
            const enrollment = await Enrollment.findByIdAndUpdate(id, { paymentStatus: status }, { new: true });

            // If approved, add student to course
            if (action === 'approve' && enrollment) {
                await Course.findByIdAndUpdate(enrollment.course, {
                    $addToSet: { students: enrollment.student }
                });
            }
        }
        else if (type === 'tour') {
            const status = action === 'approve' ? 'completed' : 'failed'; // or 'refunded'
            const booking = await TourBooking.findByIdAndUpdate(id, { paymentStatus: status }, { new: true });

            // If approved, confirm booking status too?
            if (action === 'approve' && booking) {
                await TourBooking.findByIdAndUpdate(id, { bookingStatus: 'confirmed' });
                // Add to Tour participants?
                // Tour model has detailed participants array.
                // We need to check if user is already there or push.
                // Assuming logic:
                const tour = await Tour.findById(booking.tour);
                if (tour) {
                    const existingParticipant = tour.participants.some((p: any) => p.user.toString() === booking.user.toString());
                    if (existingParticipant) {
                        // Update status
                        await Tour.updateOne(
                            { _id: booking.tour, "participants.user": booking.user },
                            { $set: { "participants.$.status": "confirmed" } }
                        );
                    } else {
                        // Add new
                        await Tour.findByIdAndUpdate(booking.tour, {
                            $push: {
                                participants: {
                                    user: booking.user,
                                    status: 'confirmed',
                                    joinedAt: new Date()
                                }
                            }
                        });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, message: `Transaction ${action}ed` });

    } catch (error) {
        console.error('Unified Action Error:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
