'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';

interface Notification {
    _id: string;
    sender: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    type: string;
    message: string;
    post?: { _id: string; content: string };
    team?: { _id: string; name: string };
    read: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { status } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchNotifications();
        }
    }, [filter, status]);

    const fetchNotifications = async () => {
        if (status !== 'authenticated') return;
        setLoading(true);
        try {
            const params = filter === 'unread' ? '?unreadOnly=true' : '';
            const response = await fetch(`/api/notifications${params}`);
            const data = await response.json();

            if (data.notifications) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'POST',
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, read: true } : n)
                );
                // setUnreadCount(prev => Math.max(0, prev - 1)); // This line is commented out as setUnreadCount is not defined in the provided context.
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', {
                method: 'PUT',
            });

            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">Notifications</h1>

                <div className="flex items-center justify-between">
                    <Select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-48"
                    >
                        <option value="all">All Notifications</option>
                        <option value="unread">Unread Only</option>
                    </Select>

                    {notifications.some(n => !n.read) && (
                        <Button onClick={markAllAsRead} variant="outline" size="sm">
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading notifications...
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                        {filter === 'unread'
                            ? "You're all caught up!"
                            : "We'll notify you when something interesting happens"}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${!notification.read ? 'border-primary/50 bg-primary/5' : ''
                                }`}
                            onClick={() => !notification.read && markAsRead(notification._id)}
                        >
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                                    {notification.sender.name[0]}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                        <span className="font-semibold">{notification.sender.name}</span>{' '}
                                        <span className="text-muted-foreground">{notification.message}</span>
                                    </p>

                                    {notification.post && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                            "{notification.post.content}"
                                        </p>
                                    )}

                                    {notification.team && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Team: {notification.team.name}
                                        </p>
                                    )}

                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatDate(notification.createdAt)}
                                    </p>
                                </div>

                                {!notification.read && (
                                    <div className="flex-shrink-0">
                                        <div className="h-3 w-3 bg-primary rounded-full" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
