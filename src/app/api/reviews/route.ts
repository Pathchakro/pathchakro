import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Book from '@/models/Book';
import User from '@/models/User';
import mongoose from 'mongoose';
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
            .populate('user', 'name image username rankTier')
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
        const { bookId, rating, title, content, tags, image, slug: customSlug } = body;

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

        // Robust customSlug validation and sanitization
        let validatedSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            const trimmed = customSlug.trim().toLowerCase();
            
            // Validation: alphanumeric and hyphens only, no leading/trailing hyphens
            const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
            const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile'].includes(trimmed);
            
            if (trimmed.length >= 3 && trimmed.length <= 100 && isValidPattern && !isReserved) {
                validatedSlug = trimmed;
            } else {
                 return NextResponse.json(
                    { error: 'Invalid custom slug. Use 3-100 characters, lowercase letters, numbers, and hyphens. No reserved words.' },
                    { status: 400 }
                );
            }
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

        // Generate unique slug from validated input or title fallback
        const slug = await generateUniqueSlug(Review, validatedSlug || title || 'review');

        const session_db = await mongoose.startSession();
        let populatedReview;

        await session_db.withTransaction(async () => {
            const [review] = await Review.create([{
                book: bookId,
                user: session.user.id,
                rating,
                title,
                slug,
                content,
                image: sanitizedImage,
                tags: tags || [],
                helpful: 0,
            }], { session: session_db });

            // Atomic update of book rating and review count using aggregation
            const stats = await Review.aggregate([
                { $match: { book: new mongoose.Types.ObjectId(bookId) } },
                { 
                    $group: { 
                        _id: null, 
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 }
                    } 
                }
            ]).session(session_db);

            if (stats.length > 0) {
                await Book.findByIdAndUpdate(bookId, {
                    averageRating: stats[0].averageRating,
                    totalReviews: stats[0].totalReviews,
                }, { session: session_db });
            }

            await User.findByIdAndUpdate(session.user.id, {
                $inc: { rank: 10 },
            }, { session: session_db });

            populatedReview = await Review.findById(review._id)
                .populate('book', 'title author coverImage slug')
                .populate('user', 'name image username rankTier')
                .session(session_db)
                .lean();
        });

        await session_db.endSession();

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
