import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';

export interface PopulatedOrder {
    _id: string;
    buyer: { _id: string; name: string; image?: string };
    seller: { _id: string; name: string; image?: string };
    product: { _id: string; title: string; price: number; images: string[]; category: string };
    status: string;
    createdAt: string | Date;
    totalPrice: number;
}

export interface PopulatedProduct {
    _id: string;
    slug: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    seller: { _id: string; name: string; image?: string; username: string };
}

/**
 * Cache factory for user orders to handle dynamic tags correctly.
 */
/**
 * Bounded cache configuration for user orders.
 */
const MAX_ORDERS_CACHE_SIZE = 500;
const orderCacheMap = new Map<string, Function>();

const getOrderCache = (userId: string, role: 'buyer' | 'seller') => {
    const key = `${userId}-${role}`;
    if (!orderCacheMap.has(key)) {
        // Enforce bounded cache size
        if (orderCacheMap.size >= MAX_ORDERS_CACHE_SIZE) {
            const oldestKey = orderCacheMap.keys().next().value;
            if (oldestKey !== undefined) orderCacheMap.delete(oldestKey);
        }
        
        orderCacheMap.set(key, unstable_cache(
            async () => {
                try {
                    await dbConnect();
                    const query = role === 'seller' ? { seller: userId } : { buyer: userId };
                    
                    const orders = await Order.find(query)
                        .populate('buyer', 'name image')
                        .populate('seller', 'name image')
                        .populate('product', 'title price images category')
                        .sort({ createdAt: -1 })
                        .lean();

                    return JSON.parse(JSON.stringify(orders)) as PopulatedOrder[];
                } catch (error) {
                    console.error(`Error fetching orders for user ${userId} (${role}):`, error);
                    return [];
                }
            },
            [`orders-${userId}-${role}`],
            {
                tags: ['orders', `orders-${userId}`],
                revalidate: 600
            }
        ));
    }
    return orderCacheMap.get(key)!;
};

/**
 * Cache factory for individual product details to handle dynamic tags correctly.
 */
/**
 * Bounded cache configuration for individual product details.
 */
const MAX_PRODUCTS_CACHE_SIZE = 500;
const productCacheMap = new Map<string, Function>();

const getProductCache = (slug: string) => {
    if (!productCacheMap.has(slug)) {
        // Enforce bounded cache size
        if (productCacheMap.size >= MAX_PRODUCTS_CACHE_SIZE) {
            const oldestKey = productCacheMap.keys().next().value;
            if (oldestKey !== undefined) productCacheMap.delete(oldestKey);
        }

        productCacheMap.set(slug, unstable_cache(
            async () => {
                try {
                    await dbConnect();
                    const product = await Product.findOne({ slug })
                        .populate('seller', 'name image username')
                        .lean();
                    return product ? (JSON.parse(JSON.stringify(product)) as PopulatedProduct) : null;
                } catch (error) {
                    console.error(`Error fetching product ${slug}:`, error);
                    return null;
                }
            },
            [`product-detail-${slug}`],
            {
                tags: ['marketplace', `product-${slug}`],
                revalidate: 3600
            }
        ));
    }
    return productCacheMap.get(slug)!;
};

/**
 * Fetch orders for a user with persistent caching.
 * Standardizes the query interface while using persistent caching factories.
 */
export const getCachedOrders = cache(async (userId: string, role: 'buyer' | 'seller'): Promise<PopulatedOrder[]> => {
    const cachedFn = getOrderCache(userId, role);
    return cachedFn();
});

/**
 * Fetch a single product by slug with persistent caching.
 */
export const getCachedProductBySlug = cache(async (slug: string): Promise<PopulatedProduct | null> => {
    const cachedFn = getProductCache(slug);
    return cachedFn();
});
