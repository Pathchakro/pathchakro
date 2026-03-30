import { Metadata } from 'next';
import { cache } from 'react';
import dbConnect from '@/lib/mongodb';
import Tour from '@/models/Tour';
import TourDetailsClient from './TourDetailsClient';
import { notFound, redirect } from 'next/navigation';

interface Props {
    params: Promise<{ slug: string }>;
}

const getTour = cache(async (slug: string) => {
    await dbConnect();

    let decodedSlug = slug;
    try {
        decodedSlug = decodeURIComponent(slug);
    } catch (error) {
        console.error('[URI_DECODE_ERROR]:', error);
    }

    let tour = await Tour.findOne({ slug: decodedSlug })
        .populate('organizer', 'name image university rankTier')
        .populate('participants.user', 'name image university rankTier')
        .populate('team', 'name text')
        .lean();

    if (!tour) {
        // Try without decoding if decoding failed or if it was already decoded
        tour = await Tour.findOne({ slug })
            .populate('organizer', 'name image university rankTier')
            .populate('participants.user', 'name image university rankTier')
            .populate('team', 'name text')
            .lean();
    }

    if (!tour && slug.match(/^[0-9a-fA-F]{24}$/)) {
        tour = await Tour.findById(slug)
            .populate('organizer', 'name image university rankTier')
            .populate('participants.user', 'name image university rankTier')
            .populate('team', 'name text')
            .lean();
    }

    return tour;
});

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const tour = await getTour(params.slug);

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
    const tour = await getTour(params.slug);

    if (!tour) {
        notFound();
    }

    // Redirect to slug-based URL if accessed by ID
    if (params.slug === tour._id.toString() && tour.slug) {
        redirect(`/tours/${tour.slug}`);
    }

    // Convert MongoDB document to plain object for client component
    const plainTour = JSON.parse(JSON.stringify(tour));

    return <TourDetailsClient initialTour={plainTour} slug={params.slug} />;
}
