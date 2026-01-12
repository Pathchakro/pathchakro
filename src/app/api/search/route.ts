import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Post from '@/models/Post';
import Book from '@/models/Book';
import Team from '@/models/Team';

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

        const searchRegex = { $regex: query, $options: 'i' };
        const results: any = {};

        // Search Users
        if (type === 'all' || type === 'users') {
            const users = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { university: searchRegex },
                    { thana: searchRegex },
                ],
            })
                .select('name email image university thana rankTier')
                .limit(20)
                .lean();

            results.users = users;
        }

        // Search Posts
        if (type === 'all' || type === 'posts') {
            const posts = await Post.find({
                content: searchRegex,
                privacy: { $in: ['public', 'friends'] }, // Don't show team-only posts in search
            })
                .populate('author', 'name image rankTier')
                .sort({ createdAt: -1 })
                .limit(20)
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
                ],
            })
                .sort({ averageRating: -1, totalReviews: -1 })
                .limit(20)
                .lean();

            results.books = books;
        }

        // Search Teams
        if (type === 'all' || type === 'teams') {
            const teams = await Team.find({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                ],
                privacy: 'public', // Only show public teams
            })
                .populate('leader', 'name image rankTier')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            results.teams = teams;
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
