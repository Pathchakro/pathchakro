'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

interface Order {
    _id: string;
    product: {
        _id: string;
        title: string;
        category: string;
        images: string[];
    };
    buyer: {
        _id: string;
        name: string;
    };
    seller: {
        _id: string;
        name: string;
    };
    quantity: number;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: string;
}

interface OrdersClientProps {
    initialOrders: Order[];
    role: 'buyer' | 'seller';
}

export default function OrdersClient({ initialOrders, role }: OrdersClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const handleRoleChange = (newRole: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('role', newRole);
        router.push(`/marketplace/orders?${params.toString()}`);
    };

    const getStatusStyles = (status: string) => {
        const s = status || 'pending';
        switch (s) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'completed': return 'bg-green-50 text-green-700 border-green-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 pb-20">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Order Management</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        {role === 'seller' ? 'Monitor and manage your sales history' : 'Track your purchases and delivery status'}
                    </p>
                </div>
                <div className="flex bg-muted/50 p-1.5 rounded-2xl border-2">
                    <Button 
                        variant={role === 'buyer' ? 'default' : 'ghost'} 
                        className={`rounded-xl px-6 font-bold ${role === 'buyer' ? 'shadow-lg' : ''}`}
                        onClick={() => handleRoleChange('buyer')}
                    >
                        Purchases
                    </Button>
                    <Button 
                        variant={role === 'seller' ? 'default' : 'ghost'} 
                        className={`rounded-xl px-6 font-bold ${role === 'seller' ? 'shadow-lg' : ''}`}
                        onClick={() => handleRoleChange('seller')}
                    >
                        Sales
                    </Button>
                </div>
            </div>

            {initialOrders.length === 0 ? (
                <div className="text-center py-24 bg-card border-2 border-dashed rounded-[3rem]">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Package className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">No orders found</h3>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                        {role === 'seller' ? 'You haven\'t sold any items yet.' : 'You haven\'t made any purchases yet.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {initialOrders.map((order) => {
                        const safeStatus = order.status || 'pending';
                        const safeQuantity = order.quantity ?? 0;
                        const safeTotalPrice = order.totalPrice ?? 0;
                        const productTitle = order.product?.title || 'Unknown Product';

                        return (
                            <div key={order._id} className="group bg-card border-2 rounded-3xl p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="relative h-32 w-32 rounded-2xl overflow-hidden shrink-0 border-2 bg-muted shadow-sm">
                                        <Image 
                                            src={order.product?.images?.[0] || '/placeholder.png'} 
                                            alt={productTitle} 
                                            fill 
                                            className="object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="font-black text-xl group-hover:text-primary transition-colors">{productTitle}</h3>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{order.product?.category}</p>
                                            </div>
                                            <span className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border ${getStatusStyles(safeStatus)}`}>
                                                {safeStatus}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t-2 border-dashed">
                                            <div className="space-y-1">
                                                <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                                                    <Package className="h-3 w-3" /> Quantity
                                                </p>
                                                <p className="font-black text-lg">{safeQuantity}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider">Total Price</p>
                                                <p className="font-black text-lg text-primary">৳{safeTotalPrice.toLocaleString()}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {role === 'seller' ? 'Buyer' : 'Seller'}
                                                </p>
                                                <p className="font-bold text-sm truncate">{role === 'seller' ? order.buyer?.name : order.seller?.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-muted-foreground text-[10px] uppercase font-black tracking-wider flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" /> Date
                                                </p>
                                                <p className="font-bold text-sm">{formatDate(order.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
