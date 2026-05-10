import { getCachedProducts } from '@/lib/data/products';
import MarketplaceClient from '@/components/marketplace/MarketplaceClient';

export const metadata = {
    title: 'Marketplace - Pathchakro',
    description: 'Buy and sell books, stationery, and educational materials within the Pathchakro community.',
};

export default async function MarketplacePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
    const condition = typeof searchParams.condition === 'string' ? searchParams.condition : undefined;
    const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
    
    // Robust price validation
    let minPrice: number | undefined = undefined;
    let maxPrice: number | undefined = undefined;

    if (typeof searchParams.minPrice === 'string') {
        const parsed = parseInt(searchParams.minPrice);
        if (Number.isFinite(parsed) && parsed >= 0) {
            minPrice = parsed;
        }
    }

    if (typeof searchParams.maxPrice === 'string') {
        const parsed = parseInt(searchParams.maxPrice);
        if (Number.isFinite(parsed) && parsed >= 0) {
            maxPrice = parsed;
        }
    }

    // Enforce logical price range
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        // If range is illogical, we swap or unset to avoid query failure
        [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    // Direct database call with unstable_cache
    const products = await getCachedProducts({
        category,
        condition,
        search,
        minPrice,
        maxPrice
    });

    return <MarketplaceClient initialProducts={products} />;
}
