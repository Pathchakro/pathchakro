import { Metadata } from 'next';
import EventDetailClient from './EventDetailClient';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;

    await dbConnect();

    // Check if slug is a valid ObjectId (backward compatibility)
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

    return {
        title: event.title,
        description: event.description,
        openGraph: {
            title: event.title,
            description: event.description,
            images: event.banner ? [event.banner] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: event.title,
            description: event.description,
            images: event.banner ? [event.banner] : [],
        },
    };
}

export default async function EventPage(props: Props) {
    const params = await props.params;
    const slug = params.slug;

    return <EventDetailClient slug={slug} />;
}
