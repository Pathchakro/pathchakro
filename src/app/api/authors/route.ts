import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Author from '@/models/Author';
import { WRITERS_LIST } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Lazy Seeding / Syncing
        // We check if DB has fewer authors than our static list. 
        // If so, we attempt to insert missing ones.
        const count = await Author.estimatedDocumentCount();

        if (count < WRITERS_LIST.length) {
            console.log(`Syncing authors database (${count} found, ${WRITERS_LIST.length} expected)...`);

            const seedData = WRITERS_LIST.map(name => ({
                name,
                slug: slugify(name) + '-' + Math.random().toString(36).substring(2, 7)
            }));

            try {
                // ordered: false lets it continue even if some duplicates fail (which they will)
                await Author.insertMany(seedData, { ordered: false });
                console.log('Syncing complete.');
            } catch (e) {
                // Ignore duplicate key errors, that's expected
                console.log('Syncing partial (some existed).');
            }
        }

        let filter: any = {};
        if (query) {
            filter.name = { $regex: query, $options: 'i' };
        }

        const authors = await Author.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({ authors });
    } catch (error: any) {
        console.error('Error fetching authors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch authors' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { name, bio, image } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Author name is required' },
                { status: 400 }
            );
        }

        const slug = await generateUniqueSlug(Author, name);

        const author = await Author.create({
            name,
            bio,
            image,
            slug
        });

        return NextResponse.json({ author }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating author:', error);
        return NextResponse.json(
            { error: 'Failed to create author' },
            { status: 500 }
        );
    }
}
