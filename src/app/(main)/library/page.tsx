import { auth } from '@/auth';
import { getCachedUserLibrary, getCachedLibraryGlobalBooks } from '@/lib/data/library';
import LibraryClient from '@/components/library/LibraryClient';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'My Library - Pathchakro',
    description: 'Manage your personal book collection, track reading progress, and explore community library books.',
};

export default async function MyLibraryPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login?callbackUrl=/library');
    }

    // Parallel direct database calls with unstable_cache
    const [library, globalBooks] = await Promise.all([
        getCachedUserLibrary(session.user.id),
        getCachedLibraryGlobalBooks()
    ]);

    return (
        <LibraryClient 
            initialLibrary={library} 
            initialGlobalBooks={globalBooks} 
        />
    );
}
