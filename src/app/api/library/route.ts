import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const bookId = searchParams.get('bookId');
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const author = searchParams.get('author');
        const isOwned = searchParams.get('isOwned');

        await dbConnect();

        let targetUserId = userId;

        // If no userId provided, must be logged in to see own library
        if (!targetUserId) {
            if (!session?.user?.id) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
            targetUserId = session.user.id;
        }

        let filter: any = { user: targetUserId };

        if (bookId) {
            filter.book = bookId;
        }

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

        // Logic for updating Book stats (copies and completedCount)
        const Book = (await import('@/models/Book')).default;

        // 1. Copies logic
        if (!existingItem && isOwned === true) {
            await Book.findByIdAndUpdate(bookId, { $inc: { copies: 1 } });
        } else if (existingItem && !wasOwned && isOwned === true) {
            await Book.findByIdAndUpdate(bookId, { $inc: { copies: 1 } });
        } else if (existingItem && wasOwned && isOwned === false) {
            await Book.findByIdAndUpdate(bookId, { $inc: { copies: -1 } });
        }

        // 2. Completed count logic
        const previousStatus = existingItem?.status || '';
        if (status !== undefined && status !== previousStatus) {
            if (status === 'completed') {
                await Book.findByIdAndUpdate(bookId, { $inc: { completedCount: 1 } });
            } else if (previousStatus === 'completed') {
                await Book.findByIdAndUpdate(bookId, { $inc: { completedCount: -1 } });
            }
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

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get('bookId');

        if (!bookId) {
            return NextResponse.json(
                { error: 'Book ID is required' },
                { status: 400 }
            );
        }

        const mongoose = await dbConnect();

        // Start a session for the transaction to ensure atomicity
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();

        try {
            // Atomic delete that returns the document, preventing TOCTOU issues
            const deletedItem = await UserLibrary.findOneAndDelete(
                { user: session.user.id, book: bookId },
                { session: dbSession }
            );

            if (deletedItem && deletedItem.isOwned) {
                // Decrement copies ONLY if the deleted item was owned, within the same transaction
                const Book = (await import('@/models/Book')).default;
                await Book.findByIdAndUpdate(
                    bookId,
                    { $inc: { copies: -1 } },
                    { session: dbSession }
                );
            }

            if (deletedItem && deletedItem.status === 'completed') {
                // Decrement completedCount if the deleted item was completed
                const Book = (await import('@/models/Book')).default;
                await Book.findByIdAndUpdate(
                    bookId,
                    { $inc: { completedCount: -1 } },
                    { session: dbSession }
                );
            }

            // Commit all changes atomically
            await dbSession.commitTransaction();

            return NextResponse.json(
                { library: null, message: 'Removed from library successfully' },
                { status: 200 }
            );
        } catch (error) {
            // Abort the transaction if any part of the sequence fails
            await dbSession.abortTransaction();
            throw error;
        } finally {
            // Always close the session to release resources
            dbSession.endSession();
        }
    } catch (error: any) {
        console.error('Error removing from library:', error);
        return NextResponse.json(
            { error: 'Failed to remove from library' },
            { status: 500 }
        );
    }
}
