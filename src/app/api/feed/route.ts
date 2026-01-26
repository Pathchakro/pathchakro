import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Review from '@/models/Review';
import Event from '@/models/Event';
import Course from '@/models/Course';
import Tour from '@/models/Tour';
import Book from '@/models/Book'; // Ensure Book model is registered for Review population

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Ensure Book model is registered
        console.log('Registered Models:', Object.keys(mongoose.connection.models));
        // Force Book model registration check
        if (!mongoose.models.Book) {
            console.log('Book model not registered in feed, registering...');
            // Forces the import to be used and executed if not already
            const _ = Book.schema;
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const cursor = searchParams.get('cursor'); // Timestamp

        const query: any = {};
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        // Fetch from all sources
        // We fetch 'limit' items from each to ensure we have enough to interleave
        // This is a naive aggregation but works for reasonable limits
        const [posts, reviews, events, courses, tours] = await Promise.all([
            Post.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('author', 'name image rankTier')
                .lean(),
            Review.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('user', 'name image rankTier')
                .populate('book', 'title author coverImage slug')
                .lean(),                .sort({ createdAt: -1 })
                    .limit(limit)
                    .populate('organizer', 'name image')
                    .populate('team', 'name')
                    .lean(),
            Course.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(), // Course instructor population might be needed if displayed, currently card doesn't strictly depend on it for basic view or uses it as ID
            Tour.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('organizer', 'name image')
                .lean(),
        ]);

        // Tag them with types
        const typedPosts = posts.map(p => ({ ...p, type: 'post' }));
        const typedReviews = reviews.map(r => {
            if (r.title) console.log('Found review with title:', r.title);
            else console.log('Review missing title:', r._id);
            return { ...r, type: 'review' };
        });
        const typedEvents = events.map(e => ({ ...e, type: 'event' }));
        const typedCourses = courses.map(c => ({ ...c, type: 'course' }));
        const typedTours = tours.map(t => ({ ...t, type: 'tour' }));

        // Combine and sort
        const combined = [
            ...typedPosts,
            ...typedReviews,
            ...typedEvents,
            ...typedCourses,
            ...typedTours
        ].sort((a: any, b: any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Take top 'limit'
        const result = combined.slice(0, limit);

        // Calculate next cursor
        let nextCursor = null;
        if (result.length > 0) {
            nextCursor = result[result.length - 1].createdAt;
        }

        return NextResponse.json({
            items: result,
            nextCursor,
            hasMore: result.length === limit // Approximately true, good enough for "load more"
        });

    } catch (error) {
        console.error('Error fetching feed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feed' },
            { status: 500 }
        );
    }
}
