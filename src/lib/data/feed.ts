import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Review from '@/models/Review';
import Event from '@/models/Event';
import Course from '@/models/Course';
import Tour from '@/models/Tour';
import Book from '@/models/Book';
import WritingProject from '@/models/WritingProject';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * Deterministic serialization of query objects for stable cache keys.
 */
const stableStringify = (obj: any): string => {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',') + '}';
};


const fetchUnifiedFeed = async (query: { limit?: number; cursor?: string }) => {
    await dbConnect();

    // Force Book model registration check
    if (!mongoose.models.Book) {
        const _ = Book.schema;
    }

    const { limit = 10, cursor } = query;
    const filter: any = {};

    if (cursor) {
        const d = new Date(cursor);
        if (!Number.isNaN(d.getTime())) {
            filter.createdAt = { $lt: d };
        }
    }

    // Overfetch from each source to ensure merged pagination doesn't skip items.
    // We fetch limit * 2 items from each.
    const overfetchLimit = limit * 2;

    const [posts, reviews, events, courses, tours, books] = await Promise.all([
        Post.find(filter)
            .sort({ createdAt: -1 })
            .limit(overfetchLimit)
            .populate('author', 'name image rankTier')
            .lean(),
        Review.find(filter)
            .sort({ createdAt: -1 })
            .limit(overfetchLimit)
            .populate('user', 'name image rankTier')
            .populate('book', 'title author coverImage slug')
            .lean(),
        Event.find(filter)
            .sort({ createdAt: -1 })
            .limit(overfetchLimit)
            .populate('organizer', 'name image')
            .populate('team', 'name')
            .populate('roles.speakers.user', 'name image')
            .populate('listeners.user', 'name image')
            .lean(),
        Course.find(filter)
            .sort({ createdAt: -1 })
            .limit(overfetchLimit)
            .populate('instructor', 'name image')
            .lean(),
        Tour.find(filter)
            .sort({ createdAt: -1 })
            .limit(overfetchLimit)
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
            { $limit: overfetchLimit },
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
                    totalWords: '$totalWords',
                    totalChapters: '$totalChapters'
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
    const chapterItems = books;

    // Combine, sort by createdAt globally, and slice to the requested limit.
    const allItems = [
        ...typedPosts,
        ...typedReviews,
        ...typedEvents,
        ...typedCourses,
        ...typedTours,
        ...chapterItems,
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const items = allItems.slice(0, limit);

    // Determine next cursor only if there are more items beyond the returned slice
    const nextCursor = allItems.length > items.length ? items[items.length - 1].createdAt : null;

    return JSON.parse(JSON.stringify({
        items,
        nextCursor
    }));
};

/**
 * Exported cached feed fetcher (Request Memoization + Persistent Cache)
 */
export const getCachedFeed = cache(
    async (query: { limit?: number; cursor?: string }) => {
        return unstable_cache(
            () => fetchUnifiedFeed(query),
            ['feed-list', stableStringify(query)],
            {
                tags: ['feed'],
                revalidate: 3600
            }
        )();
    }
);
