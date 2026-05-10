'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
    _id: string;
    sender: {
        _id: string;
        name: string;
        image?: string;
    };
    message: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationsClient({ initialNotifications, filter }: { initialNotifications: Notification[], filter: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [notifications, setNotifications] = useState(initialNotifications);

    const handleFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('unreadOnly', newFilter === 'unread' ? 'true' : 'false');
        router.push(`/notifications?${params.toString()}`);
    };

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            if (response.ok) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to mark as read');
            }
        } catch (error: any) {
            console.error('Error marking as read:', error);
            toast.error(error.message || 'Network error occurred');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 pb-20 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground font-medium mt-1">Stay updated with your community and course activities.</p>
                </div>
                <div className="flex bg-muted/50 p-1.5 rounded-2xl border-2 shrink-0">
                    <Button 
                        variant={filter === 'all' ? 'default' : 'ghost'} 
                        className={`rounded-xl px-6 font-bold ${filter === 'all' ? 'shadow-lg' : ''}`}
                        onClick={() => handleFilterChange('all')}
                    >
                        All
                    </Button>
                    <Button 
                        variant={filter === 'unread' ? 'default' : 'ghost'} 
                        className={`rounded-xl px-6 font-bold ${filter === 'unread' ? 'shadow-lg' : ''}`}
                        onClick={() => handleFilterChange('unread')}
                    >
                        Unread
                    </Button>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-24 bg-card border-2 border-dashed rounded-[3rem]">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="h-10 w-10 text-muted-foreground opacity-10" />
                    </div>
                    <p className="text-xl font-black text-muted-foreground">You're all caught up!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {notifications.map((n) => {
                        const safeInitial = (n.sender?.name?.trim()?.[0] || '?').toUpperCase();
                        return (
                            <button 
                                key={n._id} 
                                onClick={() => !n.read && markAsRead(n._id)}
                                disabled={n.read}
                                aria-label={`Notification: ${n.message}`}
                                className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all group relative ${
                                    !n.read 
                                    ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5 cursor-pointer hover:bg-primary/[0.08]' 
                                    : 'bg-card border-transparent opacity-60 grayscale-[0.5] cursor-default'
                                }`}
                            >
                                <div className="flex gap-5 items-start">
                                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200 shrink-0">
                                        {safeInitial}
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <p className="text-base font-medium leading-relaxed">
                                            <span className="font-black text-foreground">{n.sender?.name || 'Community'}</span> {n.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{formatDate(n.createdAt)}</p>
                                            {!n.read && (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md">
                                                    <AlertCircle className="h-2.5 w-2.5" /> New
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <div className="h-3 w-3 bg-primary rounded-full mt-2 animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.8)]" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
