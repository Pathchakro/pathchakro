import { Metadata } from 'next';
import { getCachedTourBySlug } from '@/lib/data/tours';
import TourDetailsClient from './TourDetailsClient';
import { notFound, redirect } from 'next/navigation';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const tour = await getCachedTourBySlug(params.slug);

    if (!tour) {
        return {
            title: 'Tour Not Found | Pathchakro',
        };
    }

    const imageUrl = tour.images && tour.images.length > 0
        ? tour.images[0]
        : (tour.bannerUrl || 'https://pathchakro.vercel.app/og-image.png');

    return {
        title: `${tour.title} | Educational Tour`,
        description: tour.description,
        openGraph: {
            title: tour.title,
            description: tour.description,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: tour.title,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: tour.title,
            description: tour.description,
            images: [imageUrl],
        },
    };
}

export default async function TourPage(props: Props) {
    const params = await props.params;
    
    // Direct database call with unstable_cache
    const tour = await getCachedTourBySlug(params.slug);

    if (!tour) {
        notFound();
    }

    // Redirect to slug-based URL if accessed by ID
    if (params.slug === tour._id.toString() && tour.slug) {
        redirect(`/tours/${tour.slug}`);
    }

    // Ensure the tour object is fully JSON-serializable before passing to the client component
    // This prevents "cannot serialize Mongoose document" errors
    const serializedTour = JSON.parse(JSON.stringify(tour));

    return <TourDetailsClient initialTour={serializedTour} slug={params.slug} />;
}
