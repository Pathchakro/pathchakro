import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const author = searchParams.get('author');
        const isOwned = searchParams.get('isOwned');

        await dbConnect();

        let filter: any = { user: session.user.id };

        if (status) {
            filter.status = status;
        }

        if (isOwned === 'true') {
            filter.isOwned = true;
        }

        const library = await UserLibrary.find(filter)
            .populate({
                path: 'book',
                select: 'title author category coverImage publisher averageRating totalReviews slug description pdfUrl addedBy copies',
                populate: {
                    path: 'addedBy',
                    select: 'name image _id'
                }
            })
            .sort({ addedAt: -1 })
            .lean();

        // Filter by category or author if specified
        let filteredLibrary = library;

        if (category) {
            filteredLibrary = library.filter((item: any) =>
                item.book?.category?.includes(category)
            );
        }

        if (author) {
            filteredLibrary = library.filter((item: any) =>
                item.book?.author?.toLowerCase().includes(author.toLowerCase())
            );
        }

        return NextResponse.json({ library: filteredLibrary });
    } catch (error: any) {
        console.error('Error fetching library:', error);
        return NextResponse.json(
            { error: 'Failed to fetch library' },
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

        const { bookId, status, isOwned } = await request.json();

        if (!bookId) {
            return NextResponse.json(
                { error: 'Book ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Update fields based on what's provided
        const updateData: any = {
            $setOnInsert: { addedAt: new Date() }
        };

        if (status !== undefined) updateData.status = status;
        if (isOwned !== undefined) updateData.isOwned = isOwned;

        // Handle reading dates logic if status changes
        if (status === 'reading') {
            updateData.startedReading = new Date();
        } else if (status === 'completed') {
            updateData.completedReading = new Date();
        }

        // Check previous state for availability update
        const existingItem = await UserLibrary.findOne({ user: session.user.id, book: bookId });
        const wasOwned = existingItem?.isOwned || false;

        const libraryItem = await UserLibrary.findOneAndUpdate(
            { user: session.user.id, book: bookId },
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).populate('book', 'title author category coverImage slug');

        // Logic for updating Book copies
        // 1. New item added as owned
        if (!existingItem && isOwned === true) {
            const Book = (await import('@/models/Book')).default;
            await Book.findByIdAndUpdate(bookId, { $inc: { copies: 1 } });
        }
        // 2. Existing item changed to owned
        else if (existingItem && !wasOwned && isOwned === true) {
            const Book = (await import('@/models/Book')).default;
            await Book.findByIdAndUpdate(bookId, { $inc: { copies: 1 } });
        }
        // 3. Existing item changed to NOT owned
        else if (existingItem && wasOwned && isOwned === false) {
            const Book = (await import('@/models/Book')).default;
            await Book.findByIdAndUpdate(bookId, { $inc: { copies: -1 } });
        }

        return NextResponse.json(
            { library: libraryItem, message: 'Library updated successfully' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error adding to library:', error);
        return NextResponse.json(
            { error: 'Failed to update library' },
            { status: 500 }
        );
    }
}
