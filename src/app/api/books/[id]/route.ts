import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        await dbConnect();

        console.log('GET /api/books/[id] ID:', params.id);

        let book;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(params.id);

        if (isObjectId) {
            book = await Book.findById(params.id).lean();
        }

        // If not found by ID or not an ID, try finding by slug
        if (!book) {
            book = await Book.findOne({ slug: params.id }).lean();
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
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const body = await request.json();
        await dbConnect();

        const book = await Book.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true }
        );

        if (!book) {
            return NextResponse.json(
                { error: 'Book not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ book, message: 'Book updated successfully' });
    } catch (error: any) {
        console.error('Error updating book:', error);
        return NextResponse.json(
            { error: 'Failed to update book' },
            { status: 500 }
        );
    }
}
