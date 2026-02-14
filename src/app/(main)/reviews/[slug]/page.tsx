import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Book from '@/models/Book';
import User from '@/models/User';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { auth } from '@/auth';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

async function getReview(slug: string) {
    await dbConnect();

    // Ensure models are registered
    const _ = {
        Book: Book.schema,
        User: User.schema
    };

    try {
        // Try to find by slug first
        let review = await Review.findOne({ slug })
            .populate('book', 'title author coverImage slug')
            .populate('user', 'name image rankTier')
            .lean();

        // Fallback: Try to find by ID if slug lookup failed and it looks like an ID
        if (!review && /^[0-9a-fA-F]{24}$/.test(slug)) {
            review = await Review.findById(slug)
                .populate('book', 'title author coverImage slug')
                .populate('user', 'name image rankTier')
                .lean();
        }

        if (!review) return null;

        return JSON.parse(JSON.stringify(review));
    } catch (error) {
        console.error('Error fetching review:', error);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const review = await getReview(slug);

    if (!review) {
        return {
            title: 'Review Not Found',
        };
    }

    const bookTitle = review.book?.title || 'Unknown Book';
    const userName = review.user?.name || 'Anonymous';
    const title = review.title || `${bookTitle} Review`;
    const description = `Read ${userName}'s review of ${bookTitle}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pathchakro.com';
    let imageUrl = review.image || review.book?.coverImage || '/og-default.png';

    // Ensure absolute URL
    if (imageUrl.startsWith('/')) {
        imageUrl = `${baseUrl}${imageUrl}`;
    }

    return {
        title: `${title} | Pathchakro`,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
            type: 'article',
            url: `https://www.pathchakro.com/reviews/${review.slug || review._id}`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default async function ReviewDetailsPage({ params }: PageProps) {
    const { slug } = await params;
    const review = await getReview(slug);
    const session = await auth();

    if (!review) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Link
                href="/reviews"
                className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Reviews
            </Link>

            <ReviewCard
                review={review}
                currentUserId={session?.user?.id}
                isDetail={true}
            />
        </div>
    );
}
