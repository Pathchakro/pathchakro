import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Module-scoped cached function for fetching products
 */
const fetchProducts = unstable_cache(
    async (category: string, condition: string, search: string, minPrice: number, maxPrice: number) => {
        await dbConnect();
        
        let mongoFilter: any = {};

        if (category) mongoFilter.category = category;
        if (condition) mongoFilter.condition = condition;
        if (search) {
            const safeSearch = escapeRegex(search);
            mongoFilter.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } }
            ];
        }
        
        if (minPrice > 0 || maxPrice < 1000000) {
            mongoFilter.price = {};
            if (minPrice > 0) mongoFilter.price.$gte = minPrice;
            if (maxPrice < 1000000) mongoFilter.price.$lte = maxPrice;
        }

        const products = await Product.find(mongoFilter)
            .populate('seller', 'name image')
            .sort({ createdAt: -1 })
            .limit(40)
            .lean();

        return JSON.parse(JSON.stringify(products));
    },
    ['products-list'],
    {
        tags: ['products'],
        revalidate: 3600
    }
);

/**
 * Module-scoped cached function for fetching a single product
 */
const fetchSingleProduct = unstable_cache(
    async (id: string) => {
        await dbConnect();
        const product = await Product.findById(id)
            .populate('seller', 'name image username rankTier')
            .lean();
        return product ? JSON.parse(JSON.stringify(product)) : null;
    },
    ['product-detail'],
    {
        tags: ['products'],
        revalidate: 3600
    }
);

/**
 * Public export for fetching products with caching
 */
export const getCachedProducts = cache(
    async (query: { category?: string; condition?: string; search?: string; minPrice?: number; maxPrice?: number }) => {
        return fetchProducts(
            query.category || '',
            query.condition || '',
            query.search || '',
            Number(query.minPrice) || 0,
            Number(query.maxPrice) || 1000000
        );
    }
);

/**
 * Public export for fetching a single product by ID with caching
 */
export const getCachedProductById = cache(
    async (id: string) => {
        return fetchSingleProduct(id);
    }
);
