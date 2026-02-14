import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Review from '@/models/Review';
import Event from '@/models/Event';
import Course from '@/models/Course';
import Tour from '@/models/Tour';
import Book from '@/models/Book'; // Ensure Book model is registered for Review population
import WritingProject from '@/models/WritingProject';

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


        const [posts, reviews, events, courses, tours, books] = await Promise.all([
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
                .lean(),
            Event.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('organizer', 'name image')
                .populate('team', 'name')
                .lean(),
            Course.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(),
            Tour.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('organizer', 'name image')
                .lean(),
            WritingProject.aggregate([
                { $match: { visibility: 'public' } },
                { $unwind: '$chapters' },
                {
                    $match: {
                        'chapters.visibility': 'public',
                        'chapters.status': 'published',
                        ...(cursor ? { 'chapters.createdAt': { $lt: new Date(cursor) } } : {})
                    }
                },
                { $sort: { 'chapters.createdAt': -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'authorDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$authorDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: '$chapters._id',
                        type: 'chapter',
                        bookId: '$_id',
                        title: '$title',
                        slug: '$slug',
                        coverImage: '$coverImage',
                        author: {
                            _id: { $ifNull: ['$authorDetails._id', '$author'] },
                            name: { $ifNull: ['$authorDetails.name', 'Unknown Author'] },
                            image: { $ifNull: ['$authorDetails.image', null] },
                            rankTier: { $ifNull: ['$authorDetails.rankTier', null] }
                        },
                        chapterTitle: '$chapters.title',
                        chapterNumber: '$chapters.chapterNumber',
                        chapterSlug: '$chapters.slug',
                        createdAt: '$chapters.createdAt',
                        category: '$category',
                        totalWords: '$totalWords', // Project totals
                        totalChapters: '$totalChapters' // Project totals
                    }
                }
            ]),
        ]);

        // Tag them with types
        const typedPosts = posts.map(p => ({ ...p, type: 'post' }));
        const typedReviews = reviews.map(r => ({ ...r, type: 'review' }));
        const typedEvents = events.map(e => ({ ...e, type: 'event' }));
        const typedCourses = courses.map(c => ({ ...c, type: 'course' }));
        const typedTours = tours.map(t => ({ ...t, type: 'tour' }));
        // Books aggregation already defines the structure and type: 'chapter'
        const chapterItems = books;

        // Combine and sort
        const combined = [
            ...typedPosts,
            ...typedReviews,
            ...typedEvents,
            ...typedCourses,
            ...typedTours,
            ...chapterItems,
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
