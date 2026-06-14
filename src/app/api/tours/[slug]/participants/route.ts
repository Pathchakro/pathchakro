import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function PATCH(
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

        const { userId, status } = await request.json();

        if (!userId || !['confirmed', 'declined', 'pending'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid parameters' },
                { status: 400 }
            );
        }

        await dbConnect();

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

        // Check if the current user is the organizer or an admin
        const isOrganizer = tour.organizer.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin' || session.user.role === 'super-admin';

        if (!isOrganizer && !isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: Only the organizer or admin can update status' },
                { status: 403 }
            );
        }

        // Update the participant status in the array
        const result = await Tour.updateOne(
            {
                ...tourPath,
                'participants.user': userId
            },
            {
                $set: {
                    'participants.$.status': status
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Participant not found in this tour' },
                { status: 404 }
            );
        }

        // Invalidate Next.js cache
        revalidateTag('tours', 'max');
        revalidateTag(`tour-${tour.slug}`, 'max');
        revalidateTag(`tour-${tour._id}`, 'max');
        revalidatePath('/', 'layout');

        return NextResponse.json({
            message: `Participant status updated to ${status}`,
            success: true,
        });
    } catch (error: any) {
        console.error('Error updating participant status:', error);
        return NextResponse.json(
            { error: 'Failed to update participant status' },
            { status: 500 }
        );
    }
}
