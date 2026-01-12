import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import { auth } from '@/auth';
import { slugify } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const category = searchParams.get('category');

        let filter: any = {};

        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { author: { $regex: query, $options: 'i' } },
            ];
        }

        if (category) {
            const categories = category.split(',').map(c => c.trim());
            filter.category = { $in: categories };
        }

        const books = await Book.find(filter)
            .sort({ averageRating: -1, totalReviews: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({ books });
    } catch (error: any) {
        console.error('Error fetching books:', error);
        return NextResponse.json(
            { error: 'Failed to fetch books' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, author, publisher, isbn, category, coverImage } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if book already exists
        const duplicateCheckQuery: any = {
            title: { $regex: `^${title}$`, $options: 'i' },
        };

        if (author) {
            duplicateCheckQuery.author = { $regex: `^${author}$`, $options: 'i' };
        }

        let book = await Book.findOne(duplicateCheckQuery);

        if (!book) {
            const session = await auth(); // Need to import auth
            const userId = session?.user?.id;

            const baseSlug = slugify(author ? `${title} ${author}` : title);
            // Check if slug exists
            const existingBookWithSlug = await Book.findOne({ slug: baseSlug });
            const slug = existingBookWithSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

            book = await Book.create({
                title,
                author,
                slug,
                publisher: publisher || '',
                isbn: isbn || undefined,
                category: category || [],
                coverImage: coverImage || '',
                averageRating: 0,
                totalReviews: 0,
                addedBy: userId,
            });
        }

        return NextResponse.json({ book }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating book:', error);
        return NextResponse.json(
            { error: 'Failed to create book' },
            { status: 500 }
        );
    }
}
