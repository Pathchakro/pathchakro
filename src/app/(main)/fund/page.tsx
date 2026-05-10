import { auth } from '@/auth';
import { getCachedFundStats } from '@/lib/data/fund';
import FundClient from '@/components/fund/FundClient';

export const metadata = {
    title: 'Fund & Community Support - Pathchakro',
    description: 'Support the community through donations or apply for project funding to drive impact.',
};

export default async function FundPage() {
    const session = await auth();
    const userId = session?.user?.id;

    // Direct database call with unstable_cache
    const stats = await getCachedFundStats(userId);

    return (
        <FundClient 
            initialStats={stats} 
            session={session} 
        />
    );
}
