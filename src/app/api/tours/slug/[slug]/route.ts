import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const { slug } = params;

        let tour = await Tour.findOne({ slug })
            .populate('organizer', 'name image university rankTier')
            .populate('participants.user', 'name image')
            .populate('team', 'name')
            .lean();

        if (!tour && slug.match(/^[0-9a-fA-F]{24}$/)) {
            tour = await Tour.findById(slug)
                .populate('organizer', 'name image university rankTier')
                .populate('participants.user', 'name image')
                .populate('team', 'name')
                .lean();
        }

        if (!tour) {
            return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
        }

        return NextResponse.json(tour);
    } catch (error) {
        console.error('Fetch Tour Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tour' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();

        const { slug } = params;
        const query = { $or: [{ slug }] } as any;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: slug });
        }

        const tour = await Tour.findOne(query);

        if (!tour) {
            return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
        }

        if (tour.organizer.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updatedTour = await Tour.findByIdAndUpdate(
            tour._id,
            { ...data },
            { new: true }
        );

        return NextResponse.json(updatedTour);
    } catch (error) {
        console.error('Update Tour Error:', error);
        return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { slug } = params;
        const query = { $or: [{ slug }] } as any;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: slug });
        }

        const tour = await Tour.findOne(query);

        if (!tour) {
            return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
        }

        if (tour.organizer.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await Tour.findByIdAndDelete(tour._id);

        return NextResponse.json({ message: 'Tour deleted successfully' });
    } catch (error) {
        console.error('Delete Tour Error:', error);
        return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 });
    }
}
