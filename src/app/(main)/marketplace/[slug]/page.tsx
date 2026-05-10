import { getCachedProductById } from '@/lib/data/products';
import ProductDetailClient from './ProductDetailClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const product = await getCachedProductById(params.slug);
    if (!product) return { title: 'Product Not Found' };

    // Defensively handle missing description and images
    const description = product.description 
        ? product.description.slice(0, 160) 
        : `View ${product.title} on Pathchakro Marketplace.`;
    
    const ogImages = product.images?.[0] 
        ? [{ url: product.images[0], alt: product.title }] 
        : [];

    return {
        title: `${product.title} | Marketplace - Pathchakro`,
        description: description,
        openGraph: {
            title: product.title,
            description: description,
            ...(ogImages.length > 0 ? { images: ogImages } : {}),
        },
    };
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    
    // Direct database call with unstable_cache
    const product = await getCachedProductById(params.slug);

    if (!product) notFound();

    return <ProductDetailClient initialProduct={product} productId={params.slug} />;
}
