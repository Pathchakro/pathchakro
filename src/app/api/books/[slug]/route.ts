import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;

    try {
        await dbConnect();

        console.log('GET /api/books/[slug] Slug:', params.slug);

        let book;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);

        if (isObjectId) {
            book = await Book.findById(params.slug).lean();
        }

        // If not found by ID or not an ID, try finding by slug
        if (!book) {
            book = await Book.findOne({ slug: params.slug }).lean();
        }

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ book });
    } catch (error: any) {
        console.error('Error fetching book:', error);
        return NextResponse.json(
            { error: 'Failed to fetch book' },
            { status: 500 }
        );
    }
}

export async function PATCH(
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

        const body = await request.json();
        await dbConnect();

        // 1. Find the book first to check authorization
        let book;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);

        if (isObjectId) {
            book = await Book.findById(params.slug);
        }

        if (!book) {
            book = await Book.findOne({ slug: params.slug });
        }

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        // 2. Authorization check (Owner or Admin)
        const isOwner = book.addedBy && book.addedBy.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin' || (session.user as any).role === 'super-admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: You can only update books you added' },
                { status: 403 }
            );
        }

        // 3. Whitelist allowed fields to prevent mass-assignment
        const allowedFields = [
            'title', 'description', 'author', 'category', 'tags',
            'publishedDate', 'condition', 'price', 'images', 'stock', 'status'
        ];

        const updateDoc: any = {};
        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateDoc[field] = body[field];
            }
        });

        // 4. Perform the update
        const updatedBook = await Book.findByIdAndUpdate(
            book._id,
            {
                $set: updateDoc,
                $currentDate: { updatedAt: true }
            },
            { new: true, runValidators: true, context: 'query' }
        );

        return NextResponse.json({
            book: updatedBook,
            message: 'Book updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating book:', error);
        return NextResponse.json(
            { error: 'Failed to update book' },
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

        // Find the book first to check ownership
        let book;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.slug);

        if (isObjectId) {
            book = await Book.findById(params.slug);
        }

        // If not found by ID, try slug
        if (!book) {
            book = await Book.findOne({ slug: params.slug });
        }

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        // Check ownership or admin role
        // Need to cast to string for comparison as addedBy is typically ObjectId
        const isOwner = book.addedBy && book.addedBy.toString() === session.user.id;
        const isAdmin = session.user.role === 'admin' || (session.user as any).role === 'super-admin'; // Adjust based on your role structure

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden: You can only delete books you added' },
                { status: 403 }
            );
        }

        await Book.findByIdAndDelete(book._id);

        return NextResponse.json({ message: 'Book deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting book:', error);
        return NextResponse.json(
            { error: 'Failed to delete book' },
            { status: 500 }
        );
    }
}
