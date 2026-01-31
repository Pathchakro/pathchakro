import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Tour from '@/models/Tour';
import mongoose from 'mongoose';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Awaitable params
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        await dbConnect();

        // Check if tour exists
        // Try finding by ID first, then slug
        let tour;

        if (mongoose.Types.ObjectId.isValid(id)) {
            tour = await Tour.findById(id);
        }

        if (!tour) {
            tour = await Tour.findOne({ slug: id });
        }

        if (!tour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Initialize savedTours if undefined to fix 'possibly undefined' error
        if (!user.savedTours) {
            user.savedTours = [];
        }

        const tourIdStr = tour._id.toString();
        const isBookmarked = user.savedTours.some(
            (savedId: any) => savedId.toString() === tourIdStr
        );

        if (isBookmarked) {
            // Remove from bookmarks
            user.savedTours = (user.savedTours as any[]).filter(
                (savedId: any) => savedId.toString() !== tourIdStr
            ) as any;
        } else {
            // Add to bookmarks
            (user.savedTours as any[]).push(tour._id as any);
        }

        await user.save();

        return NextResponse.json({
            isBookmarked: !isBookmarked,
            savedTours: user.savedTours
        });

    } catch (error: any) {
        console.error('Error toggling tour bookmark:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
