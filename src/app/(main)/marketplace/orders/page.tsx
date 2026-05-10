import { auth } from '@/auth';
import { getCachedOrders } from '@/lib/data/marketplace';
import OrdersClient from '@/components/marketplace/OrdersClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'My Orders | Marketplace - Pathchakro',
    description: 'Manage your marketplace purchases and sales.',
};

export default async function OrdersPage(props: { searchParams: Promise<{ role?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();
    
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/marketplace/orders');
    }

    const role = (searchParams.role === 'seller' ? 'seller' : 'buyer') as 'buyer' | 'seller';
    
    // Direct database call with unstable_cache
    const orders = await getCachedOrders(session.user.id, role);

    return <OrdersClient initialOrders={orders} role={role} />;
}
