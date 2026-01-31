import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Review from '@/models/Review';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        await dbConnect();

        const review = await Review.findById(id);
        if (!review) {
            return NextResponse.json(
                { error: 'Review not found' },
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

        // Initialize savedReviews if undefined
        if (!user.savedReviews) {
            user.savedReviews = [];
        }

        // Check if already bookmarked
        const isBookmarked = user.savedReviews.some((reviewId: any) =>
            reviewId.toString() === id
        );

        if (isBookmarked) {
            // Remove from bookmarks
            user.savedReviews = user.savedReviews.filter(
                (reviewId: any) => reviewId.toString() !== id
            );
        } else {
            // Add to bookmarks
            user.savedReviews.push(review._id);
        }

        await user.save();

        return NextResponse.json({
            isBookmarked: !isBookmarked,
            savedReviews: user.savedReviews
        });

    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
