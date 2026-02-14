import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const filterParam = searchParams.get('filter'); // 'mine' or 'favorites'
        const userId = searchParams.get('userId');
        const destination = searchParams.get('destination');
        const status = searchParams.get('status');
        const upcoming = searchParams.get('upcoming');

        let filter: any = { privacy: { $in: ['public', 'team'] } };

        if (filterParam === 'mine') {
            const session = await auth();
            if (session?.user?.id) {
                // My tours: Created by me OR I am a confirmed participant
                // But typically "My Tours" implies managed by me or joined by me.
                // Let's stick to the logic: organizer OR participant
                filter = {
                    $or: [
                        { organizer: session.user.id },
                        { 'participants.user': session.user.id }
                    ]
                };
            }
        } else if (filterParam === 'favorites') {
            const session = await auth();
            if (session?.user?.id) {
                const user = await dbConnect().then(() => import('@/models/User').then(m => m.default.findById(session.user.id).select('savedTours')));
                if (user?.savedTours && user.savedTours.length > 0) {
                    filter = { _id: { $in: user.savedTours } };
                } else {
                    return NextResponse.json({ tours: [] });
                }
            }
        }

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

        const slug = await generateUniqueSlug(Tour, title);

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

        revalidatePath('/', 'layout');

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
