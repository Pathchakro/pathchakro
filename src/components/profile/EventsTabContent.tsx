'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Video, Users, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils'; // Try to import from lib/utils first, or define it locally if not exported

interface Event {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    eventType: string;
    location?: string;
    status: string;
    roles: {
        lecturers: any[];
    };
    listeners: any[];
}

interface EventsTabContentProps {
    userId: string;
    isOwnProfile: boolean;
}

export function EventsTabContent({ userId, isOwnProfile }: EventsTabContentProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, [userId]);

    const fetchEvents = async () => {
        try {
            const response = await fetch(`/api/events?organizer=${userId}`);
            const data = await response.json();

            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        setDeletingId(eventId);
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Event deleted successfully');
                setEvents(events.filter(e => e._id !== eventId));
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('An error occurred while deleting');
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-700';
            case 'ongoing': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-gray-100 text-gray-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Loading events...</div>;
    }

    if (events.length === 0) {
        return (
            <div className="bg-card rounded-lg p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-medium text-lg mb-1">No events found</h3>
                <p className="text-muted-foreground mb-4">
                    {isOwnProfile ? "You haven't created any events yet." : "This user hasn't created any events yet."}
                </p>
                {isOwnProfile && (
                    <Link href="/events/create">
                        <Button>Create Event</Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
                <div key={event._id} className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <Link href={`/events/${event._id}`} className="hover:underline">
                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{event.title}</h3>
                            </Link>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {event.description}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(event.status)}`}>
                                {event.status.toUpperCase()}
                            </span>
                            {isOwnProfile && (
                                <div className="flex items-center gap-1">
                                    <Link href={`/events/${event._id}/edit`}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                        onClick={() => handleDelete(event._id)}
                                        disabled={deletingId === event._id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(event.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{event.listeners.length} listeners</span>
                            </div>
                        </div>

                        {event.eventType === 'online' ? (
                            <div className="flex items-center gap-2 text-blue-600 text-xs font-medium">
                                <Video className="h-3 w-3" />
                                <span>Online Event</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 text-xs font-medium">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
