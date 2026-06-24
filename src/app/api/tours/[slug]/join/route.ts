import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import TourBooking from '@/models/TourBooking';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in to join.' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { method, transactionId, mobileNumber, name, phone, email, address, seats } = body;

        await dbConnect();

        const userId = session.user.id;
        const tourPath = /^[0-9a-fA-F]{24}$/.test(params.slug)
            ? { _id: params.slug }
            : { slug: params.slug };

        const tour = await Tour.findOne(tourPath);

        if (!tour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        // Check if user is already a participant
        const alreadyJoined = tour.participants.some(
            (p: any) => p.user.toString() === userId.toString() && p.status !== 'declined'
        );

        if (alreadyJoined) {
            return NextResponse.json(
                { error: 'You have already sent a request or joined this tour.' },
                { status: 400 }
            );
        }

        const isPaid = tour.budget > 0;
        const numSeats = seats || 1;
        const totalAmount = (tour.budget || 0) * numSeats;

        if (isPaid) {
            if (!method) {
                return NextResponse.json(
                    { error: 'Payment method is required' },
                    { status: 400 }
                );
            }
            if (!transactionId && !mobileNumber) {
                return NextResponse.json(
                    { error: 'Please provide either a Transaction ID or mobile number for payment verification' },
                    { status: 400 }
                );
            }
        }

        // Create Tour Booking
        const booking = await TourBooking.create({
            tour: tour._id,
            user: userId,
            amount: totalAmount,
            bookingStatus: 'pending',
            paymentStatus: isPaid ? 'pending' : 'completed',
            paymentDetails: {
                method: isPaid ? method : 'free',
                transactionId: transactionId || undefined,
                mobileNumber: mobileNumber || undefined,
            },
            seats: numSeats,
            name: name || session.user.name || undefined,
            phone: phone || undefined,
            email: email || session.user.email || undefined,
            address: address || undefined
        });

        // Add to participants list
        await Tour.findByIdAndUpdate(tour._id, {
            $push: {
                participants: {
                    user: userId,
                    status: 'pending',
                    joinedAt: new Date(),
                }
            }
        });

        return NextResponse.json({
            message: isPaid ? 'Join request and payment details submitted for verification!' : 'Successfully joined the tour!',
            success: true,
            booking
        });
    } catch (error: any) {
        console.error('Error joining tour:', error);
        return NextResponse.json(
            { error: 'Failed to join tour' },
            { status: 500 }
        );
    }
}
