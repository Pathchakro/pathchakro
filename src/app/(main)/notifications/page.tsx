import { auth } from '@/auth';
import { getCachedNotifications } from '@/lib/data/notifications';
import NotificationsClient from '@/components/notifications/NotificationsClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notifications | Pathchakro',
    description: 'Stay updated with your latest activities and mentions.',
};

export default async function NotificationsPage(props: { searchParams: Promise<{ unreadOnly?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();
    
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/notifications');
    }

    const unreadOnly = searchParams.unreadOnly === 'true';
    
    // Direct database call with unstable_cache
    const notifications = await getCachedNotifications(session.user.id, unreadOnly);

    return <NotificationsClient initialNotifications={notifications} filter={unreadOnly ? 'unread' : 'all'} />;
}
