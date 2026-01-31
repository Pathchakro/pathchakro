import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const tour = await Tour.findById(params.id)
            .populate('organizer', 'name image university rankTier')
            .populate('participants.user', 'name image rankTier')
            .populate('team', 'name')
            .lean();

        if (!tour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ tour });
    } catch (error: any) {
        console.error('Error fetching tour:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tour' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const tour = await Tour.findById(params.id);
        if (!tour) return NextResponse.json({ error: 'Tour not found' }, { status: 404 });

        if (tour.organizer.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const updatedTour = await Tour.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });

        revalidatePath('/', 'layout');

        return NextResponse.json({ tour: updatedTour });
    } catch (error: any) {
        console.error('Error updating tour:', error);
        return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const tour = await Tour.findById(params.id);
        if (!tour) return NextResponse.json({ error: 'Tour not found' }, { status: 404 });

        if (tour.organizer.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await Tour.findByIdAndDelete(params.id);

        revalidatePath('/', 'layout');

        return NextResponse.json({ message: 'Tour deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting tour:', error);
        return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
    }
}
