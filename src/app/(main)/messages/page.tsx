import { auth } from '@/auth';
import { getCachedConversations } from '@/lib/data/messages';
import MessagesClient from '@/components/messages/MessagesClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Messages | Pathchakro',
    description: 'Secure private messaging with the Pathchakro community.',
};

export default async function MessagesPage() {
    const session = await auth();
    
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/messages');
    }

    // Direct database call with unstable_cache for initial conversation list
    const initialMessages = await getCachedConversations(session.user.id);

    return <MessagesClient initialMessages={initialMessages} userId={session.user.id} />;
}
