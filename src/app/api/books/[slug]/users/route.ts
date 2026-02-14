import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const { slug } = params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
        const limit = (!isNaN(rawLimit) && rawLimit > 0) ? Math.min(rawLimit, 100) : 20;

        const query: any = { book: slug };

        // If status is provided, filter by it. 
        // If status is 'in-library', we don't filter by status (any status matches)
        if (status && status !== 'in-library') {
            query.status = status;
        }

        const libraryEntries = await UserLibrary.find(query)
            .populate('user', 'name image rankTier university')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Extract user data
        const users = libraryEntries
            .filter(entry => entry.user) // Filter out orphaned entries
            .map(entry => {
                const user = entry.user as any;
                return {
                    _id: user._id,
                    name: user.name,
                    image: user.image,
                    rankTier: user.rankTier,
                    university: user.university,
                    status: entry.status,
                    addedAt: entry.addedAt,
                    rating: entry.personalRating
                };
            });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching book users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
