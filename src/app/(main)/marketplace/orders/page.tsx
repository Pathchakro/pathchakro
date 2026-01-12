'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Package, ShoppingBag, User, MapPin, Phone, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

interface Order {
    _id: string;
    buyer: {
        _id: string;
        name: string;
        image?: string;
    };
    seller: {
        _id: string;
        name: string;
        image?: string;
    };
    product: {
        _id: string;
        title: string;
        price: number;
        images: string[];
        category: string;
    };
    quantity: number;
    totalPrice: number;
    status: string;
    buyerPhone: string;
    deliveryAddress: string;
    notes?: string;
    createdAt: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'buyer' | 'seller'>('buyer');

    useEffect(() => {
        fetchOrders();
    }, [viewMode]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = viewMode === 'seller' ? '?role=seller' : '';
            const response = await fetch(`/api/orders${params}`);
            const data = await response.json();

            if (data.orders) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Orders</h1>
                        <p className="text-muted-foreground">
                            {viewMode === 'seller' ? 'Manage your sales' : 'Track your purchases'}
                        </p>
                    </div>
                    <Select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'buyer' | 'seller')}
                    >
                        <option value="buyer">My Purchases</option>
                        <option value="seller">My Sales</option>
                    </Select>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading orders...
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-4">
                        {viewMode === 'seller'
                            ? 'Orders from buyers will appear here'
                            : 'Your purchase history will appear here'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-card border rounded-lg p-4">
                            <div className="flex items-start gap-4">
                                {/* Product Image */}
                                <div className="relative h-24 w-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                    {order.product.images[0] ? (
                                        <Image
                                            src={order.product.images[0]}
                                            alt={order.product.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Order Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold line-clamp-1">{order.product.title}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">
                                                {order.product.category}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                                        <p className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Quantity:</span> {order.quantity}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Total:</span> ৳{order.totalPrice.toLocaleString()}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {viewMode === 'seller' ? 'Buyer:' : 'Seller:'}
                                            </span>
                                            {viewMode === 'seller' ? order.buyer.name : order.seller.name}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">Ordered:</span> {formatDate(order.createdAt)}
                                        </p>
                                    </div>

                                    {/* Contact Info (visible to seller) */}
                                    {viewMode === 'seller' && (
                                        <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                                            <p className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">Phone:</span>
                                                <a href={`tel:${order.buyerPhone}`} className="text-primary hover:underline">
                                                    {order.buyerPhone}
                                                </a>
                                            </p>
                                            <p className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span className="font-medium">Address:</span>
                                                <span className="text-muted-foreground">{order.deliveryAddress}</span>
                                            </p>
                                            {order.notes && (
                                                <p className="text-muted-foreground">
                                                    <span className="font-medium">Notes:</span> {order.notes}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
