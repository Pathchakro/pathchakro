import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventDetailClient from './EventDetailClient';
import dbConnect from '@/lib/mongodb';
import { extractPlainText } from '@/lib/utils';
import Event from '@/models/Event';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    await dbConnect();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
    let event;

    if (isObjectId) {
        event = await Event.findById(slug).select('title description banner').lean();
    } else {
        event = await Event.findOne({ slug: slug }).select('title description banner').lean();
    }

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
    const params = await props.params;
    const slug = params.slug;

    await dbConnect();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

    const query = isObjectId ? { _id: slug } : { slug: slug };

    const eventData = await Event.findOne(query)
        .populate('organizer', 'name image rankTier')
        .populate('team', 'name')
        .populate('roles.speakers.user', 'name image').populate('listeners.user', 'name image')
        .lean();

    if (!eventData) {
        notFound();
    }

    // Convert ObjectIds to strings for passing to Client Component
    const serializedEvent = JSON.parse(JSON.stringify(eventData));

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

    // To prevent XSS, we need to escape '</' inside script tags.
    // Replacing '<' with unicode escape '\u003c' is a safe way to do this.
    const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd }}
            />
            <EventDetailClient slug={slug} initialData={serializedEvent} />
        </>
    );
}
