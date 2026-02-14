import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    try {
        const params = await props.params;
        await dbConnect();

        const { slug } = params;
        let product;

        if (/^[0-9a-fA-F]{24}$/.test(slug)) {
            product = await Product.findById(slug)
                .populate('seller', 'name image university thana rankTier')
                .lean();
        }

        if (!product) {
            product = await Product.findOne({ slug })
                .populate('seller', 'name image university thana rankTier')
                .lean();
        }

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Increment views
        // Note: findByIdAndUpdate works with ID. If we found by slug, we have product._id
        await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

        return NextResponse.json({ product });
    } catch (error: any) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
