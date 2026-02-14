import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Review from '@/models/Review';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const params = await props.params;
        const { slug } = params;

        // Validate if slug is a valid ObjectId
        if (!require('mongoose').Types.ObjectId.isValid(slug)) {
            return NextResponse.json(
                { error: 'Invalid review id' },
                { status: 400 }
            );
        }

        await dbConnect();

        const review = await Review.findById(slug);
        if (!review) {
            return NextResponse.json(
                { error: 'Review not found' },
                { status: 404 }
            );
        }

        const user = await User.findById(session.user.id).select('savedReviews');
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Initialize savedReviews if undefined (though model default usually handles this)
        if (!user.savedReviews) {
            user.savedReviews = [];
        }

        // Check if already bookmarked
        const isBookmarked = user.savedReviews.some((reviewId: any) =>
            reviewId.toString() === slug
        );

        let updatedUser;
        if (isBookmarked) {
            // Atomic remove
            updatedUser = await User.findByIdAndUpdate(
                session.user.id,
                { $pull: { savedReviews: review._id } },
                { new: true }
            ).select('savedReviews');
        } else {
            // Atomic add
            updatedUser = await User.findByIdAndUpdate(
                session.user.id,
                { $addToSet: { savedReviews: review._id } },
                { new: true }
            ).select('savedReviews');
        }

        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            isBookmarked: !isBookmarked,
            savedReviews: updatedUser.savedReviews
        });

    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
