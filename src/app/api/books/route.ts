import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/mongodb';
import Book from '@/models/Book';
import { auth } from '@/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { calculateProfileCompletion, escapeRegExp } from '@/lib/utils';
import User from '@/models/User';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const category = searchParams.get('category');

        let filter: any = {};

        if (query) {
            const escapedQuery = escapeRegExp(query.trim().substring(0, 100));
            filter.$or = [
                { title: { $regex: escapedQuery, $options: 'i' } },
                { author: { $regex: escapedQuery, $options: 'i' } },
            ];
        }

        if (category) {
            const categories = category.split(',').map(c => c.trim());
            filter.category = { $in: categories };
        }

        if (searchParams.get('hasCopies') === 'true') {
            filter.copies = { $gt: 0 };
        }

        let page = Number.parseInt(searchParams.get('page') || '1', 10);
        if (Number.isNaN(page) || page < 1) page = 1;

        let limit = Number.parseInt(searchParams.get('limit') || '20', 10);
        if (Number.isNaN(limit) || limit < 1) limit = 20;
        if (limit > 100) limit = 100;

        const skip = (page - 1) * limit;

        const [books, totalBooks] = await Promise.all([
            Book.find(filter)
                .sort({ createdAt: -1 }) // Sort by new additions first
                .populate('addedBy', 'name image _id')
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalBooks / limit);

        return NextResponse.json({
            books,
            pagination: {
                totalBooks,
                totalPages,
                currentPage: page,
                limit
            }
        });
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (calculateProfileCompletion(user) < 70) {
            return NextResponse.json(
                { error: 'Please complete your profile to perform this action' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, author, publisher, isbn, category, coverImage, buyingLink, slug: customSlug } = body;

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        // Validate and sanitize customSlug if provided to ensure URL safety
        let sanitizedCustomSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            // Only allow alphanumeric, hyphen, underscore
            sanitizedCustomSlug = customSlug.toLowerCase()
                .trim()
                .replace(/[^a-z0-9-_]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        // Check if book already exists
        const duplicateCheckQuery: any = {
            title: title.trim(),
        };

        if (author) {
            duplicateCheckQuery.author = author.trim();
        }

        let book = await Book.findOne(duplicateCheckQuery).collation({ locale: 'en', strength: 2 });

        if (!book) {
            const userId = session.user.id;
            const slug = await generateUniqueSlug(Book, sanitizedCustomSlug || (author ? `${title} ${author}` : title));

            book = await Book.create({
                title: title.trim(),
                author: author ? author.trim() : '',
                slug,
                publisher: publisher || '',
                isbn: isbn || undefined,
                category: category || [],
                coverImage: coverImage || '', // Pass coverImage to be stored as suggested
                totalReviews: 0,
                addedBy: userId,
                buyingLink: buyingLink || '',
            });

            // Revalidate cache
            revalidatePath('/books');
            revalidatePath(`/books/${slug}`);
            revalidateTag('books', 'max');
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
