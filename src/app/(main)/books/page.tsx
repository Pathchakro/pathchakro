import { getCachedBooks } from '@/lib/data/books';
import BooksClient from '@/components/books/BooksClient';

export const metadata = {
    title: 'Book Library - Pathchakro',
    description: 'Discover, review, and track your reading journey with our community-driven book library.',
};

export default async function BooksPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    
    // Handle potential array query params for q and category (use first element if array)
    const qRaw = searchParams.q;
    const q = Array.isArray(qRaw) ? qRaw[0] : (typeof qRaw === 'string' ? qRaw : undefined);
    
    const catRaw = searchParams.category;
    const category = Array.isArray(catRaw) ? catRaw[0] : (typeof catRaw === 'string' ? catRaw : undefined);

    // Robust page parsing to prevent NaN, zero, or negative values
    const pageRaw = searchParams.page;
    const pageStr = Array.isArray(pageRaw) ? pageRaw[0] : pageRaw;
    const pageInt = typeof pageStr === 'string' ? parseInt(pageStr, 10) : 1;
    const page = Number.isInteger(pageInt) && pageInt > 0 ? pageInt : 1;

    // Direct database call with unstable_cache
    const { books, pagination } = await getCachedBooks({
        q,
        category,
        page,
        limit: 20
    });

    return <BooksClient initialBooks={books} pagination={pagination} />;
}
