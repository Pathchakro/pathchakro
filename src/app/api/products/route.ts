import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const condition = searchParams.get('condition');
        const search = searchParams.get('search');
        const sellerId = searchParams.get('sellerId');

        let filter: any = { status: 'active', stock: { $gt: 0 } };

        if (category) filter.category = category;
        if (condition) filter.condition = condition;
        if (sellerId) filter.seller = sellerId;

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }

        if (search) {
            filter.$text = { $search: search };
        }

        const products = await Product.find(filter)
            .populate('seller', 'name image university thana')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({ products });
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
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

        const body = await request.json();
        const {
            title,
            description,
            category,
            price,
            originalPrice,
            images,
            stock,
            condition,
            tags,
            location,
        } = body;

        if (!title || !description || !category || !price || !images || !stock || !location) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        let product = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const slug = await generateUniqueSlug(Product, title);

                product = await Product.create({
                    seller: session.user.id,
                    title,
                    slug,
                    description,
                    category,
                    price,
                    originalPrice,
                    images,
                    stock,
                    condition: condition || 'new',
                    tags: tags || [],
                    location,
                    status: 'active',
                    views: 0,
                });
                break; // Success
            } catch (error: any) {
                if (error.code === 11000) {
                    console.warn(`Slug collision detected for product "${title}", retrying...`);
                    attempts++;
                    if (attempts < maxAttempts) {
                        continue;
                    }
                    // Break on final attempt to fall through to 409 response
                    break;
                }
                throw error; // Rethrow if not a collision
            }
        }

        if (!product) {
            return NextResponse.json(
                { error: 'Failed to generate a unique slug after multiple attempts' },
                { status: 409 }
            );
        }

        const populatedProduct = await Product.findById(product._id)
            .populate('seller', 'name image university thana')
            .lean();

        return NextResponse.json(
            { product: populatedProduct },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
