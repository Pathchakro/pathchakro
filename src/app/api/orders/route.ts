import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';

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
        const { productId, quantity, buyerPhone, deliveryAddress, notes } = body;

        if (!productId || !quantity || !buyerPhone || !deliveryAddress) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            );
        }

        await dbConnect();

        const product = await Product.findById(productId);

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        if (product.stock < quantity) {
            return NextResponse.json(
                { error: 'Insufficient stock' },
                { status: 400 }
            );
        }

        // Calculate total price
        const totalPrice = product.price * quantity;

        // Create order
        const order = await Order.create({
            buyer: session.user.id,
            seller: product.seller,
            product: productId,
            quantity,
            totalPrice,
            buyerPhone,
            deliveryAddress,
            notes,
            status: 'pending',
        });

        // Update product stock
        product.stock -= quantity;
        if (product.stock === 0) {
            product.status = 'sold';
        }
        await product.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('buyer', 'name image')
            .populate('seller', 'name image')
            .populate('product', 'title price images')
            .lean();

        return NextResponse.json(
            { order: populatedOrder },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role'); // 'buyer' or 'seller'

        let filter: any = {};
        if (role === 'seller') {
            filter.seller = session.user.id;
        } else {
            filter.buyer = session.user.id;
        }

        const orders = await Order.find(filter)
            .populate('buyer', 'name image')
            .populate('seller', 'name image')
            .populate('product', 'title price images category')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
