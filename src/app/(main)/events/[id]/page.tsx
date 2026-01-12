import { Metadata } from 'next';
import EventDetailClient from './EventDetailClient';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;

    await dbConnect();
    const event = await Event.findById(id).select('title description banner').lean();

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
    return <EventDetailClient eventId={params.id} />;
}
