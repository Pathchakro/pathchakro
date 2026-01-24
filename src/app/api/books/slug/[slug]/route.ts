import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        await dbConnect();

        const { slug } = params;

        let book = await Book.findOne({ slug })
            .populate('addedBy', 'name image university rankTier')
            .lean();

        if (!book && slug.match(/^[0-9a-fA-F]{24}$/)) {
            book = await Book.findById(slug)
                .populate('addedBy', 'name image university rankTier')
                .lean();
        }

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json(book);
    } catch (error) {
        console.error('Fetch Book Error:', error);
        return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();

        const { slug } = params;
        const query = { $or: [{ slug }] } as any;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: slug });
        }

        const book = await Book.findOne(query);

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        if (book.addedBy && book.addedBy.toString() !== session.user.id) {
            // For books, maybe admins can edit too? For now check owner.
            // Also checking if addedBy exists (some might be system added).
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updatedBook = await Book.findByIdAndUpdate(
            book._id,
            { ...data },
            { new: true }
        );

        return NextResponse.json(updatedBook);
    } catch (error) {
        console.error('Update Book Error:', error);
        return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { slug } = params;
        const query = { $or: [{ slug }] } as any;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: slug });
        }

        const book = await Book.findOne(query);

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        if (book.addedBy && book.addedBy.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await Book.findByIdAndDelete(book._id);

        return NextResponse.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete Book Error:', error);
        return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }
}
