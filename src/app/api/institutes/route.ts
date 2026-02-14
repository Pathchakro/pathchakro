import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Institute from '@/models/Institute';
import { EDUCATONAL_INSTITUTE } from '@/lib/constants';
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

        // Lazy Seeding / Syncing logic
        const count = await Institute.estimatedDocumentCount();

        if (count < EDUCATONAL_INSTITUTE.length) {
            console.log(`Syncing institutes database (${count} found, ${EDUCATONAL_INSTITUTE.length} expected)...`);

            const seedData = EDUCATONAL_INSTITUTE.map(name => ({
                name,
                slug: slugify(name) + '-' + Math.random().toString(36).substring(2, 7)
            }));

            try {
                // ordered: false lets it continue even if some duplicates fail
                await Institute.insertMany(seedData, { ordered: false });
                console.log('Syncing institutes complete.');
            } catch (e) {
                console.log('Syncing institutes partial (some existed).');
            }
        }

        let filter: any = {};
        if (query) {
            filter.name = { $regex: query, $options: 'i' };
        }

        const institutes = await Institute.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({ institutes });
    } catch (error: any) {
        console.error('Error fetching institutes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch institutes' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Institute name is required' },
                { status: 400 }
            );
        }

        const slug = await generateUniqueSlug(Institute, name);

        // Check if name already exists (optional, but good practice to prevent duplicates if desired)
        // If we want to allow duplicates with different slugs, remove this check.
        // Assuming user wants to allow creation if slug is unique.

        const institute = await Institute.create({
            name,
            slug
        });

        return NextResponse.json({ institute }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating institute:', error);
        return NextResponse.json(
            { error: 'Failed to create institute' },
            { status: 500 }
        );
    }
}
