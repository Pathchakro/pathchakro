import { getCachedBookBySlug } from '@/lib/data/books';
import BookDetailClient from './BookDetailClient';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const book = await getCachedBookBySlug(params.slug);
    if (!book) return { title: 'Book Not Found' };

    // Defensively handle missing cover image for OpenGraph
    const ogImages = book.coverImage && typeof book.coverImage === 'string' && book.coverImage.trim() 
        ? [{ url: book.coverImage, alt: book.title }] 
        : [];

    return {
        title: `${book.title} by ${book.author} | Pathchakro`,
        description: book.description || `Read reviews and details about ${book.title} by ${book.author} on Pathchakro.`,
        openGraph: {
            title: book.title,
            description: book.description,
            ...(ogImages.length > 0 ? { images: ogImages } : {}),
        },
    };
}

export default async function BookDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const session = await auth();
    
    // Direct database call with unstable_cache
    const book = await getCachedBookBySlug(params.slug);

    if (!book) notFound();

    return <BookDetailClient initialBook={book} sessionUser={session?.user || null} />;
}
