import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import UserLibrary from '@/models/UserLibrary';
import Book from '@/models/Book';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { slug } = params;
        let libraryItem;

        // 1. Try finding by Library Item ID
        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            libraryItem = await UserLibrary.findOne({
                _id: slug,
                user: session.user.id,
            }).populate('book');
        }

        // 2. If not found, try finding by Book Slug or Book ID
        if (!libraryItem) {
            let bookId = slug;
            // If not an ObjectId, find book by slug to get ID
            if (!/^[0-9a-fA-F]{24}$/.test(slug)) {
                const book = await Book.findOne({ slug }).select('_id');
                if (book) {
                    bookId = book._id;
                } else {
                    // If book not found by slug, and not ID, then nothing to search
                    return NextResponse.json(
                        { error: 'Book not found' },
                        { status: 404 }
                    );
                }
            }

            // Search by book ID (either passed directly or resolved from slug)
            if (bookId) {
                libraryItem = await UserLibrary.findOne({
                    book: bookId,
                    user: session.user.id,
                }).populate('book');
            }
        }

        if (!libraryItem) {
            return NextResponse.json(
                { error: 'Library item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            library: libraryItem,
        });
    } catch (error: any) {
        console.error('Error fetching library item:', error);
        return NextResponse.json(
            { error: 'Failed to fetch library item' },
            { status: 500 }
        );
    }
}

const allowedStatuses = ['want-to-read', 'reading', 'completed'];

function validateLibraryUpdate(body: any) {
    const { status, personalRating, personalNotes } = body;
    const errors: string[] = [];

    if (status !== undefined && !allowedStatuses.includes(status)) {
        errors.push(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`);
    }

    if (personalRating !== undefined) {
        const rating = Number(personalRating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            errors.push('Personal rating must be a number between 1 and 5');
        }
    }

    if (personalNotes !== undefined) {
        if (typeof personalNotes !== 'string') {
            errors.push('Personal notes must be a string');
        } else if (personalNotes.length > 2000) {
            errors.push('Personal notes cannot exceed 2000 characters');
        }
    }

    return errors.length > 0 ? errors.join('. ') : null;
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
        }

        const validationError = validateLibraryUpdate(body);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 422 });
        }

        const { status, personalRating, personalNotes } = body;

        await dbConnect();
        const { slug } = params;
        let libraryItem;

        // 1. Try finding by Library Item ID
        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            libraryItem = await UserLibrary.findOne({
                _id: slug,
                user: session.user.id,
            });
        }

        // 2. If not found, try finding by Book Slug or Book ID
        if (!libraryItem) {
            let bookId = slug;
            if (!/^[0-9a-fA-F]{24}$/.test(slug)) {
                const book = await Book.findOne({ slug }).select('_id');
                if (book) bookId = book._id;
                else return NextResponse.json({ error: 'Book not found' }, { status: 404 });
            }

            if (bookId) {
                libraryItem = await UserLibrary.findOne({
                    book: bookId,
                    user: session.user.id,
                });
            }
        }

        if (!libraryItem) {
            return NextResponse.json(
                { error: 'Library item not found' },
                { status: 404 }
            );
        }

        if (status !== undefined) {
            libraryItem.status = status;

            if (status === 'reading' && !libraryItem.startedReading) {
                libraryItem.startedReading = new Date();
            }

            if (status === 'completed' && !libraryItem.completedReading) {
                libraryItem.completedReading = new Date();
            }
        }

        if (personalRating !== undefined) {
            libraryItem.personalRating = personalRating;
        }

        if (personalNotes !== undefined) {
            libraryItem.personalNotes = personalNotes;
        }

        await libraryItem.save();

        return NextResponse.json({
            library: libraryItem,
            message: 'Library item updated',
        });
    } catch (error: any) {
        console.error('Error updating library item:', error);
        return NextResponse.json(
            { error: 'Failed to update library item' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { slug } = params;
        let query: any = null;

        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            // Could be Library ID or Book ID. 
            // Logic: Check if it exists as Library ID first.
            const existsAsLibraryId = await UserLibrary.exists({ _id: slug, user: session.user.id });
            if (existsAsLibraryId) {
                query = { _id: slug, user: session.user.id };
            } else {
                // Assume Book ID
                query = { book: slug, user: session.user.id };
            }
        } else {
            // Book Slug
            const book = await Book.findOne({ slug }).select('_id');
            if (book) {
                query = { book: book._id, user: session.user.id };
            } else {
                return NextResponse.json({ error: 'Book not found' }, { status: 404 });
            }
        }

        if (!query) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        const result = await UserLibrary.findOneAndDelete(query);

        if (!result) {
            return NextResponse.json(
                { error: 'Library item not found' },
                { status: 404 }
            );
        }

        // Recalculate copies for robustness
        const count = await UserLibrary.countDocuments({ book: result.book, isOwned: true });
        // Dynamic import to avoid circular dependency if any? (Though Book is imported at top)
        // Keeping it consistent with previous code
        await Book.findByIdAndUpdate(result.book, { copies: count });

        return NextResponse.json({
            message: 'Book removed from library',
        });
    } catch (error: any) {
        console.error('Error removing from library:', error);
        return NextResponse.json(
            { error: 'Failed to remove book from library' },
            { status: 500 }
        );
    }
}
