import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
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

        const tour = await Tour.findById(params.id);

        if (!tour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        const userId = session.user.id;

        // Check if already a participant
        const isParticipant = tour.participants.some(
            (p: any) => p.user.toString() === userId
        );

        if (isParticipant) {
            return NextResponse.json(
                { error: 'Already joined this tour' },
                { status: 400 }
            );
        }

        // Add as pending participant
        tour.participants.push({
            user: userId,
            status: 'pending',
            joinedAt: new Date(),
        });

        await tour.save();

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
