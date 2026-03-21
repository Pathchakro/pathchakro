import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import Book from '@/models/Book';
import Team from '@/models/Team';
import Review from '@/models/Review';
import Event from '@/models/Event';
import Tour from '@/models/Tour';
import Course from '@/models/Course';
import { escapeRegExp } from '@/lib/utils';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type') || 'all';

        if (!query || query.trim().length < 2) {
            return NextResponse.json(
                { error: 'Search query must be at least 2 characters' },
                { status: 400 }
            );
        }

        await dbConnect();

        const escapedQuery = escapeRegExp(query);
        const searchRegex = { $regex: escapedQuery, $options: 'i' };
        const session = await auth();
        const results: any = {};

        // Search Posts
        if (type === 'all' || type === 'posts') {
            const postQuery: any = {
                content: searchRegex,
            };

            if (session?.user?.id) {
                // Fetch up-to-date following list from DB
                const currentUser = await User.findById(session.user.id).select('following').lean();
                const followingIds = (currentUser as any)?.following || [];
                
                // If authenticated, show public posts OR friends' posts
                // Defining friends as people you follow
                postQuery.$or = [
                    { privacy: 'public' },
                    { privacy: 'friends', author: { $in: [...followingIds, session.user.id] } }
                ];
            } else {
                // If unauthenticated, only show public posts
                postQuery.privacy = 'public';
            }

            const posts = await Post.find(postQuery)
                .populate('author', 'name image rankTier')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            results.posts = posts;
        }

        // Search Books
        if (type === 'all' || type === 'books') {
            const books = await Book.find({
                $or: [
                    { title: searchRegex },
                    { author: searchRegex },
                    { publisher: searchRegex },
                    { category: searchRegex },
                ],
            })
                .select('title author publisher coverImage slug category averageRating totalReviews description pdfUrl copies')
                .sort({ averageRating: -1, totalReviews: -1 })
                .limit(10)
                .lean();

            results.books = books;
        }

        // Search Reviews
        if (type === 'all' || type === 'reviews') {
            const reviews = await Review.find({
                $or: [
                    { title: searchRegex },
                    { content: searchRegex },
                    { tags: searchRegex },
                ],
            })
                .populate('book', 'title author coverImage slug')
                .populate('user', 'name image rankTier')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            results.reviews = reviews;
        }

        // Search Events
        if (type === 'all' || type === 'events') {
            const events = await Event.find({
                $or: [
                    { title: searchRegex },
                    { description: searchRegex },
                    { location: searchRegex },
                ],
                startTime: { $gte: new Date() },
                privacy: 'public',
            })
                .populate('organizer', 'name image')
                .sort({ startTime: 1 })
                .limit(10)
                .lean();

            results.events = events;
        }

        // Search Tours
        if (type === 'all' || type === 'tours') {
            const tours = await Tour.find({
                $or: [
                    { title: searchRegex },
                    { destination: searchRegex },
                    { description: searchRegex },
                ],
                privacy: 'public',
            })
                .populate('organizer', 'name image')
                .sort({ startDate: 1 })
                .limit(10)
                .lean();

            results.tours = tours;
        }

        // Search Courses
        if (type === 'all' || type === 'courses') {
            const courses = await Course.find({
                $or: [
                    { title: searchRegex },
                    { description: searchRegex },
                ],
                privacy: 'public',
            })
                .populate('instructor', 'name image')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            results.courses = courses;
        }

        // Calculate total results
        const totalResults = Object.values(results).reduce(
            (sum: number, arr: any) => sum + (arr?.length || 0),
            0
        );

        return NextResponse.json({
            query,
            type,
            results,
            totalResults,
        });
    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
