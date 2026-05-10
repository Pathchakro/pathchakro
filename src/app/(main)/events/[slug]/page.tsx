import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventDetailClient from './EventDetailClient';
import { extractPlainText } from '@/lib/utils';
import { getCachedEventBySlug } from '@/lib/data/events';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const decodedParams = await params;
    const slug = decodeURIComponent(decodedParams.slug);

    const event = await getCachedEventBySlug(slug);

    if (!event) {
        return {
            title: 'Event Not Found',
        };
    }

    const ogImage = event.banner || '/OG_pathchakro.png';
    const cleanDescription = extractPlainText(event.description || '');

    return {
        title: `${event.title} | PathChakro Events`,
        description: cleanDescription.slice(0, 160), 
        openGraph: {
            title: event.title,
            description: cleanDescription.slice(0, 200),
            type: 'article',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: event.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: event.title,
            description: cleanDescription.slice(0, 200),
            images: [ogImage],
        },
    };
}

export default async function EventPage(props: Props) {
    const decodedParams = await props.params;
    const slug = decodeURIComponent(decodedParams.slug);

    // Direct database call with unstable_cache
    const eventData = await getCachedEventBySlug(slug);

    if (!eventData) {
        notFound();
    }

    // Structured Data for SEO
    const cleanDescription = extractPlainText(eventData.description || '');
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'EducationEvent',
        name: eventData.title,
        description: cleanDescription,
        startDate: eventData.startTime,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: eventData.eventType === 'online' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
        location: eventData.eventType === 'online' ? {
            '@type': 'VirtualLocation',
            url: eventData.meetingLink,
        } : {
            '@type': 'Place',
            name: eventData.location,
            address: {
                '@type': 'PostalAddress',
                addressLocality: 'Dhaka',
                addressRegion: 'Dhaka',
                addressCountry: 'BD',
            },
        },
        image: [
            eventData.banner || '/OG_pathchakro.png'
        ],
        organizer: {
            '@type': 'Organization',
            name: 'PathChakro',
            url: 'https://pathchakro.com',
        },
        performer: (eventData.roles?.speakers || []).map((s: any) => ({
            '@type': 'Person',
            name: s.user?.name || 'Speaker',
        })),
    };

    const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd }}
            />
            <EventDetailClient slug={slug} initialData={eventData} />
        </>
    );
}
