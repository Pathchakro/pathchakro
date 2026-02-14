import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Book from '@/models/Book';
import User from '@/models/User';
import { validateAndSanitizeImage } from '@/lib/utils';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get('bookId');
        const userId = searchParams.get('userId');
        const search = searchParams.get('search');

        const filterParam = searchParams.get('filter');

        let filter: any = {};
        if (bookId) filter.book = bookId;
        if (userId) filter.user = userId;

        if (filterParam === 'mine') {
            const session = await auth();
            if (session?.user?.id) {
                filter.user = session.user.id;
            }
        } else if (filterParam === 'favorites') {
            const session = await auth();
            if (session?.user?.id) {
                const user = await User.findById(session.user.id).select('savedReviews');
                if (user?.savedReviews && user.savedReviews.length > 0) {
                    filter._id = { $in: user.savedReviews };
                } else {
                    return NextResponse.json({ reviews: [] });
                }
            }
        }

        if (search) {
            // Find books that match the search term
            const matchingBooks = await Book.find({
                title: { $regex: search, $options: 'i' }
            }).select('_id');
            const bookIds = matchingBooks.map(b => b._id);

            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { book: { $in: bookIds } }
            ];
        }

        const reviews = await Review.find(filter)
            .populate('book', 'title author coverImage slug')
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
        const { bookId, rating, title, content, tags, image } = body;

        if (!bookId || !rating || !content || !title) {
            return NextResponse.json(
                { error: 'Book ID, rating, title, and content are required' },
                { status: 400 }
            );
        }

        if (title.length > 70) {
            return NextResponse.json(
                { error: 'Title cannot exceed 70 characters' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        let sanitizedImage: string | undefined;
        try {
            sanitizedImage = validateAndSanitizeImage(image);
        } catch (error: any) {
            console.error('Image validation error:', error);
            return NextResponse.json(
                { error: 'Invalid image input. Please ensure it is a valid URL or base64 string.' },
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

        // Generate unique slug
        const slug = await generateUniqueSlug(Review, title || 'review');

        const review = await Review.create({
            book: bookId,
            user: session.user.id,
            rating,
            title,
            slug,
            content,
            image: sanitizedImage,
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
            .populate('book', 'title author coverImage slug')
            .populate('user', 'name image rankTier')
            .lean();

        revalidatePath('/', 'layout');

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
