import { Metadata } from 'next';
import { auth } from '@/auth';
import ReviewsContent from '@/components/reviews/ReviewsContent';
import { getCachedReviews, getCachedSavedReviewIds } from '@/lib/data/reviews';

export const metadata: Metadata = {
    title: 'Book Reviews | Pathchakro',
    description: 'Discover and read the latest book reviews from the Pathchakro community. Share your thoughts and join the conversation.',
    alternates: {
        canonical: 'https://www.pathchakro.com/reviews',
    },
    openGraph: {
        title: 'Book Reviews | Pathchakro',
        description: 'Discover and read the latest book reviews from the Pathchakro community.',
        url: 'https://www.pathchakro.com/reviews',
        siteName: 'Pathchakro',
        type: 'website',
    },
};

export default async function ReviewsPage() {
    const session = await auth();
    const userId = session?.user?.id;

    // Direct database call with unstable_cache
    const reviews = await getCachedReviews({ limit: 10, page: 1 });
    
    let savedReviewIds: string[] = [];
    if (userId) {
        savedReviewIds = await getCachedSavedReviewIds(userId);
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Book Reviews | Pathchakro',
        description: 'A collection of book reviews from the Pathchakro community.',
        url: 'https://www.pathchakro.com/reviews',
    };

    return (
        <div className="max-w-2xl mx-auto p-4 min-h-screen pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <h1 className="text-2xl font-bold mb-6">Book Reviews</h1>

            <ReviewsContent
                initialReviews={reviews}
                currentUserId={userId}
                initialSavedReviewIds={savedReviewIds}
            />
        </div>
    );
}
