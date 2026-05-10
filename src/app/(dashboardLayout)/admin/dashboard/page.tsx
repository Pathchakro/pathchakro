import { auth } from '@/auth';
import { getCachedAdminAnalytics } from '@/lib/data/admin';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Pathchakro',
    description: 'Platform analytics and financial overview.',
};

export default async function AdminDashboardPage(props: { searchParams: Promise<{ period?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();
    
    // Authorization check
    if (!session || (session.user as any).role !== 'admin' && (session.user as any).role !== 'super-admin') {
        redirect('/');
    }

    const period = searchParams.period || '30';
    
    // Direct database call with unstable_cache
    const analytics = await getCachedAdminAnalytics(period);

    return <AdminDashboardClient initialData={analytics} period={period} />;
}
