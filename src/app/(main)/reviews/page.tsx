import { Metadata } from 'next';
import { auth } from '@/auth';
import ReviewsContent from '@/components/reviews/ReviewsContent';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Book from '@/models/Book'; // Register models
import User from '@/models/User'; // Register models

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

async function getInitialData() {
    const session = await auth();
    const userId = session?.user?.id;

    await dbConnect();

    // Register models explicitly for Next.js dev mode
    const _ = { Book: Book.schema, User: User.schema };

    const reviews = await Review.find({})
        .populate('book', 'title author coverImage slug')
        .populate('user', 'name image rankTier')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    let savedReviewIds: string[] = [];
    if (userId) {
        const user = await User.findById(userId).select('savedReviews').lean();
        if (user && user.savedReviews) {
            savedReviewIds = user.savedReviews.map((id: any) => id.toString());
        }
    }

    return {
        reviews: JSON.parse(JSON.stringify(reviews)),
        userId,
        savedReviewIds,
    };
}

export default async function ReviewsPage() {
    const { reviews, userId, savedReviewIds } = await getInitialData();

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
