import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import slugify from 'slugify';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const destination = searchParams.get('destination');
        const status = searchParams.get('status');
        const upcoming = searchParams.get('upcoming') === 'true';

        let filter: any = { privacy: { $in: ['public', 'team'] } };

        if (userId) {
            // If viewing specific user's tours (created or joined), show all public/team tours
            // or all tours if they are the organizer (handling privacy).
            // For now, simpler: show everything related to them.
            filter = {
                $or: [
                    { organizer: userId },
                    { 'participants.user': userId }
                ]
            };
        }

        if (destination) {
            filter.destination = { $regex: destination, $options: 'i' };
        }

        if (status) {
            filter.status = status;
        }

        if (upcoming) {
            filter.startDate = { $gte: new Date() };
            filter.status = { $in: ['planning', 'confirmed'] };
        }

        const tours = await Tour.find(filter)
            .populate('organizer', 'name image university rankTier')
            .populate('participants.user', 'name image')
            .populate('team', 'name')
            .sort({ startDate: 1 })
            .limit(50)
            .lean();

        return NextResponse.json({ tours });
    } catch (error: any) {
        console.error('Error fetching tours:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tours' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            destination,
            departureLocation,
            bannerUrl,
            description,
            startDate,
            endDate,
            budget,
            itinerary,
            privacy,
            teamId,
        } = body;

        if (!title || !destination || !departureLocation || !description || !startDate || !endDate || budget === undefined) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        let slug = slugify(title, { lower: true, strict: true });

        let counter = 1;
        while (await Tour.findOne({ slug })) {
            slug = `${slugify(title, { lower: true, strict: true })}-${counter}`;
            counter++;
        }

        const tour = await Tour.create({
            organizer: session.user.id,
            title,
            slug,
            destination,
            departureLocation,
            bannerUrl,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            budget,
            participants: [
                {
                    user: session.user.id,
                    status: 'confirmed',
                    joinedAt: new Date(),
                },
            ],
            itinerary: itinerary || [],
            images: [],
            privacy: privacy || 'public',
            team: teamId || undefined,
            status: 'planning',
        });

        const popularTour = await Tour.findById(tour._id)
            .populate('organizer', 'name image university rankTier')
            .populate('participants.user', 'name image')
            .lean();

        return NextResponse.json(
            { tour: popularTour },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating tour:', error);
        return NextResponse.json(
            { error: 'Failed to create tour' },
            { status: 500 }
        );
    }
}
