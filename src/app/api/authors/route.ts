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

        const count = await Author.estimatedDocumentCount();

        if (count < WRITERS_LIST.length) {
            console.log(`Syncing authors database (${count} found, ${WRITERS_LIST.length} expected)...`);

            const seedData = WRITERS_LIST.map(name => ({
                name,
                slug: slugify(name) + '-' + Math.random().toString(36).substring(2, 7)
            }));

            try {
                await Author.insertMany(seedData, { ordered: false });
                console.log('Syncing complete.');
            } catch (e) {
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
        const { name, bio, image, slug: customSlug } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Author name is required' },
                { status: 400 }
            );
        }

        // Robust customSlug validation and sanitization
        let normalizedSlug = undefined;
        if (typeof customSlug === 'string' && customSlug.trim()) {
            const trimmed = customSlug.trim().toLowerCase();
            
            // Validation: alphanumeric and hyphens only, no leading/trailing hyphens, no consecutive hyphens
            const isValidPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmed);
            const isReserved = ['admin', 'api', 'settings', 'auth', 'dashboard', 'profile'].includes(trimmed);
            const hasPathTraversal = trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\');
            
            if (trimmed.length >= 3 && trimmed.length <= 64 && isValidPattern && !isReserved && !hasPathTraversal) {
                normalizedSlug = trimmed;
            } else {
                 return NextResponse.json(
                    { error: 'Invalid custom slug. Use 3-64 characters, lowercase letters, numbers, and single hyphens. No reserved words or path separators.' },
                    { status: 400 }
                );
            }
        }

        const slug = await generateUniqueSlug(Author, normalizedSlug || name);

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
