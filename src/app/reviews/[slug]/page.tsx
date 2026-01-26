import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Post from '@/models/Post'; // Ensure models are registered
import Book from '@/models/Book'; // Ensure models are registered
import User from '@/models/User'; // Ensure models are registered
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { auth } from '@/auth';

interface PageProps {
    params: {
        slug: string;
    };
}

async function getReview(slug: string) {
    await dbConnect();

    // Ensure models are registered (Next.js hot reload edge case)
    const _ = {
        Post: Post.schema,
        Book: Book.schema,
        User: User.schema
    };

    try {
        console.log('Fetching review for identifier:', slug);

        // Try to find by slug
        let review = await Review.findOne({ slug })
            .populate('book', 'title author coverImage slug')
            .populate('user', 'name image rankTier')
            .lean();

        if (review) console.log('Found by slug');

        // Fallback: Try to find by ID (if slug lookup failed and it looks like an ID)
        if (!review && /^[0-9a-fA-F]{24}$/.test(slug)) {
            console.log('Attempting lookup by ID...');
            review = await Review.findById(slug)
                .populate('book', 'title author coverImage slug')
                .populate('user', 'name image rankTier')
                .lean();
            if (review) console.log('Found by ID');
        }

        if (!review) {
            console.log('Review not found for:', slug);
            return null;
        }

        // Convert _id to string for serialization
        return JSON.parse(JSON.stringify(review));
    } catch (error) {
        console.error('Error fetching review:', error);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const review = await getReview(params.slug);

    if (!review) {
        return {
            title: 'Review Not Found',
        };
    }

    const bookTitle = review.book?.title || 'Unknown Book';
    const userName = review.user?.name || 'Anonymous';
    const title = review.title || `${bookTitle} Review`;
    const description = `Read ${userName}'s review of ${bookTitle}`;
    const imageUrl = review.image || review.book?.coverImage || '/og-default.png'; // Fallback to default if needed
    return {
        title: `${title} | Pathchakro`,
        description,
        openGraph: {
            title,
            description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: 'article',
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
    const review = await getReview(params.slug);
    const session = await auth();

    if (!review) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <Link
                href="/"
                className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Feed
            </Link>

            <ReviewCard
                review={review}
                currentUserId={session?.user?.id}
            />
        </div>
    );
}
