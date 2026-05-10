import { getCachedTeams } from '@/lib/data/teams';
import TeamsClient from '@/components/teams/TeamsClient';
import { auth } from '@/auth';

export const metadata = {
    title: 'Teams & Groups - Pathchakro',
    description: 'Join communities and connect with others through university, location-based, or special interest teams.',
};

export default async function TeamsPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const userId = session?.user?.id;

    const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
    const type = typeof searchParams.type === 'string' ? searchParams.type : undefined;
    const filter = typeof searchParams.filter === 'string' ? searchParams.filter : undefined;

    // Direct database call with unstable_cache
    const teams = await getCachedTeams({
        q,
        type,
        filter,
        userId
    });

    return <TeamsClient initialTeams={teams} />;
}
