import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Tour from '@/models/Tour';
import mongoose from 'mongoose';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> } // Awaitable params
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { slug } = await context.params;

        await dbConnect();

        // Check if tour exists
        // Try finding by ID first, then slug
        let tour;

        if (mongoose.Types.ObjectId.isValid(slug)) {
            tour = await Tour.findById(slug);
        }

        if (!tour) {
            tour = await Tour.findOne({ slug });
        }

        if (!tour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        const userId = session.user.id;
        const tourId = tour._id;

        // Atomic Toggle Logic:
        // 1. Try to remove the tour ID from savedTours. 
        // 2. If it was removed (modifiedCount > 0), it's now unbookmarked.
        // 3. Otherwise, add it.
        const unbookmarkResult = await User.updateOne(
            { _id: userId, savedTours: tourId },
            { $pull: { savedTours: tourId } }
        );

        let isBookmarked = false;
        if (unbookmarkResult.modifiedCount === 0) {
            // Not already bookmarked, so add it
            const bookmarkResult = await User.updateOne(
                { _id: userId },
                { $addToSet: { savedTours: tourId } }
            );

            // Only set as bookmarked if we actually matched a user document
            if (bookmarkResult.matchedCount > 0) {
                isBookmarked = true;
            }
        }

        const updatedUser = await User.findById(userId).select('savedTours').lean();

        return NextResponse.json({
            isBookmarked,
            savedTours: updatedUser?.savedTours || []
        });

    } catch (error: any) {
        console.error('Error toggling tour bookmark:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
