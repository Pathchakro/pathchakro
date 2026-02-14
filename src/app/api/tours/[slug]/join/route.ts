import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const userId = session.user.id;
        const tourPath = /^[0-9a-fA-F]{24}$/.test(params.slug)
            ? { _id: params.slug }
            : { slug: params.slug };

        // Atomic check and add participant
        const updatedTour = await Tour.findOneAndUpdate(
            {
                ...tourPath,
                'participants.user': { $ne: userId }
            },
            {
                $push: {
                    participants: {
                        user: userId,
                        status: 'pending',
                        joinedAt: new Date(),
                    }
                }
            },
            { new: true }
        );

        if (!updatedTour) {
            const tour = await Tour.findOne(tourPath);
            if (!tour) {
                return NextResponse.json(
                    { error: 'Tour not found' },
                    { status: 404 }
                );
            }

            // If tour exists but update failed, it means user is already a participant
            return NextResponse.json(
                { error: 'Already joined this tour' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: 'Join request sent',
            success: true,
        });
    } catch (error: any) {
        console.error('Error joining tour:', error);
        return NextResponse.json(
            { error: 'Failed to join tour' },
            { status: 500 }
        );
    }
}
