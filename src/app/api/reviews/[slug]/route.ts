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
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const { slug } = params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        let review;
        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            review = await Review.findById(slug);
        }

        if (!review) {
            review = await Review.findOne({ slug });
        }

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
        await Review.findByIdAndDelete(review._id);

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
        // Update user's rank (remove 10 points, floor at 0)
        await User.findByIdAndUpdate(session.user.id, [
            {
                $set: {
                    rank: { $max: [0, { $subtract: ['$rank', 10] }] }
                }
            }
        ]);

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
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const { slug } = params;
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

        let review;
        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            review = await Review.findById(slug);
        }

        if (!review) {
            review = await Review.findOne({ slug });
        }

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

        // Update fields
        // Update fields with validation
        if (rating !== undefined) {
            const numRating = Number(rating);
            if (isNaN(numRating) || numRating < 1 || numRating > 5) {
                return NextResponse.json(
                    { error: 'Rating must be between 1 and 5' },
                    { status: 400 }
                );
            }
            review.rating = numRating;
        }

        if (content !== undefined) {
            if (typeof content !== 'string') {
                return NextResponse.json(
                    { error: 'Content must be a string' },
                    { status: 400 }
                );
            }
            const trimmedContent = content.trim();
            if (trimmedContent.length === 0 || trimmedContent.length > 5000) {
                return NextResponse.json(
                    { error: 'Content must be a non-empty string (max 5000 characters after trimming)' },
                    { status: 400 }
                );
            }
            review.content = trimmedContent;
        }

        if (tags !== undefined) {
            if (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string' && tag.length <= 30)) {
                return NextResponse.json(
                    { error: 'Tags must be an array of strings (max 30 chars each)' },
                    { status: 400 }
                );
            }
            review.tags = tags;
        }

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
        if (rating !== undefined) {
            const allReviews = await Review.find({ book: review.book });
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            const averageRating = totalRating / allReviews.length;

            await Book.findByIdAndUpdate(review.book, {
                averageRating: averageRating,
            });
        }

        const updatedReview = await Review.findById(review._id)
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
