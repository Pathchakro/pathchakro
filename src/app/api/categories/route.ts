import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Category from '@/models/Category';
import { INTERESTS_LIST } from '@/lib/constants';
import { slugify } from '@/lib/utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Lazy Seeding
        const count = await Category.estimatedDocumentCount();
        if (count === 0) {
            console.log('Seeding categories...');
            const seedData = INTERESTS_LIST.map(name => ({
                name,
                slug: slugify(name),
                type: 'book_category'
            }));

            await Category.insertMany(seedData, { ordered: false });
            console.log('Seeding categories complete.');
        } else {
            // Fix for renaming "Movie Review" to Bangla
            const movieReview = await Category.findOne({ name: 'Movie Review' });
            if (movieReview) {
                console.log('Renaming Movie Review to Bangla...');
                movieReview.name = 'মুভি রিভিউ';
                await movieReview.save();
            }
            // Ensure Bangla version exists if English didn't
            const bdMovieReview = await Category.findOne({ name: 'মুভি রিভিউ' });
            if (!bdMovieReview && !movieReview) {
                await Category.create({ name: 'মুভি রিভিউ', slug: slugify('মুভি রিভিউ'), type: 'book_category' });
            }
        }

        const categories = await Category.find({}).sort({ name: 1 }).lean();

        // Return simple array of strings for backward compatibility initially, or full objects
        // Let's return objects but client can map them
        return NextResponse.json({ categories });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { name } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const slug = slugify(name);
        const category = await Category.create({ name, slug });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
