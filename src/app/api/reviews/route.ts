import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Book from '@/models/Book';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get('bookId');
        const userId = searchParams.get('userId');

        let filter: any = {};
        if (bookId) filter.book = bookId;
        if (userId) filter.user = userId;

        const reviews = await Review.find(filter)
            .populate('book', 'title author coverImage')
            .populate('user', 'name image rankTier')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({ reviews });
    } catch (error: any) {
        console.error('Error fetching reviews:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
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
        const { bookId, rating, content, tags } = body;

        if (!bookId || !rating || !content) {
            return NextResponse.json(
                { error: 'Book ID, rating, and content are required' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({
            book: bookId,
            user: session.user.id,
        });

        if (existingReview) {
            return NextResponse.json(
                { error: 'You have already reviewed this book' },
                { status: 409 }
            );
        }

        // Create review
        const review = await Review.create({
            book: bookId,
            user: session.user.id,
            rating,
            content,
            tags: tags || [],
            helpful: 0,
        });

        // Update book's average rating
        const allReviews = await Review.find({ book: bookId });
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / allReviews.length;

        await Book.findByIdAndUpdate(bookId, {
            averageRating: averageRating,
            totalReviews: allReviews.length,
        });

        // Update user's rank (add 10 points for a review)
        await User.findByIdAndUpdate(session.user.id, {
            $inc: { rank: 10 },
        });

        const populatedReview = await Review.findById(review._id)
            .populate('book', 'title author coverImage')
            .populate('user', 'name image rankTier')
            .lean();

        return NextResponse.json(
            { review: populatedReview },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating review:', error);
        return NextResponse.json(
            { error: 'Failed to create review' },
            { status: 500 }
        );
    }
}
