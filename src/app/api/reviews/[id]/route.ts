import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Book from '@/models/Book';
import User from '@/models/User';
import { validateAndSanitizeImage } from '@/lib/utils';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const review = await Review.findById(id);
        if (!review) {
            return NextResponse.json(
                { error: 'Review not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (review.user.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }
        // Delete review
        await Review.findByIdAndDelete(id);

        // Update book's average rating
        const allReviews = await Review.find({ book: review.book });

        let averageRating = 0;
        if (allReviews.length > 0) {
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            averageRating = totalRating / allReviews.length;
        }

        await Book.findByIdAndUpdate(review.book, {
            averageRating: averageRating,
            totalReviews: allReviews.length,
        });

        // Update user's rank (remove 10 points)
        await User.findByIdAndUpdate(session.user.id, {
            $inc: { rank: -10 },
        });

        revalidatePath('/', 'layout');

        return NextResponse.json({ message: 'Review deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting review:', error);
        return NextResponse.json(
            { error: 'Failed to delete review' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { rating, content, tags, image } = body;

        await dbConnect();

        const review = await Review.findById(id);
        if (!review) {
            return NextResponse.json(
                { error: 'Review not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (review.user.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Update fields
        if (rating !== undefined) review.rating = rating;
        if (content !== undefined) review.content = content;
        if (tags !== undefined) review.tags = tags;
        if (image !== undefined) {
            try {
                review.image = validateAndSanitizeImage(image);
            } catch (error: any) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }
        }

        await review.save();

        // If rating changed, update book stats
        if (rating) {
            const allReviews = await Review.find({ book: review.book });
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / allReviews.length;

            await Book.findByIdAndUpdate(review.book, {
                averageRating: averageRating,
            });
        }

        const updatedReview = await Review.findById(id)
            .populate('book', 'title author coverImage slug')
            .populate('user', 'name image rankTier')
            .lean();

        revalidatePath('/', 'layout');

        return NextResponse.json({ review: updatedReview });
    } catch (error: any) {
        console.error('Error updating review:', error);
        return NextResponse.json(
            { error: 'Failed to update review' },
            { status: 500 }
        );
    }
}
