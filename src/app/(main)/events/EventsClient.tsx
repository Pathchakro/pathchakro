'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/auth/LoginModal';
import { Select } from '@/components/ui/select';
import { Calendar, MapPin, Users, Video, Plus, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventCard } from '@/components/events/EventCard';
import LoadingSpinner from '@/components/ui/Loading';


interface Event {
    _id: string;
    organizer: {
        _id: string;
        name: string;
        image?: string;
    };
    team?: {
        _id: string;
        name: string;
    };
    title: string;
    description: string;
    eventType: string;
    location?: string;
    meetingLink?: string;
    startTime: string;
    status: string;
    roles: {
        speakers: any[];
    };
    listeners: any[];
}

export default function EventsClient({ initialEvents }: { initialEvents: Event[] }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [showUpcoming, setShowUpcoming] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleCreateEventClick = (e: React.MouseEvent) => {
        if (!session) {
            e.preventDefault();
            setShowLoginModal(true);
        }
    };

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (showUpcoming) params.append('upcoming', 'true');

            const response = await fetch(`/api/events?${params}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, showUpcoming]);

    const handleDelete = (deletedId: string) => {
        setEvents(prev => prev.filter(e => e._id !== deletedId));
    };

    useEffect(() => {
        if (isFirstLoad) {
            setIsFirstLoad(false);
            return;
        }
        fetchEvents();
    }, [fetchEvents, isFirstLoad]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-700';
            case 'ongoing': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-gray-100 text-gray-700';
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
                        <h1 className="text-3xl font-bold">Events</h1>
                        <p className="text-muted-foreground">Educational events and meetups</p>
                    </div>
                    <Link href="/events/create" onClick={handleCreateEventClick}>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Event
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                    </Select>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="upcoming"
                            checked={showUpcoming}
                            onChange={(e) => setShowUpcoming(e.target.checked)}
                            className="rounded"
                        />
                        <label htmlFor="upcoming" className="text-sm cursor-pointer">
                            Show upcoming events only
                        </label>
                    </div>
                </div>
            </div>

            {/* Events List */}
            {loading ? (
                <div className="flex justify-center py-12">
                     <LoadingSpinner />
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No events found</h3>
                    <p className="text-muted-foreground mb-4">
                        {statusFilter || showUpcoming
                            ? 'Try adjusting your filters'
                            : 'Be the first to create an event!'}
                    </p>
                    <Link href="/events/create" onClick={handleCreateEventClick}>
                        <Button>Create Event</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <EventCard 
                            key={event._id} 
                            event={event as any} 
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
            <LoginModal
                open={showLoginModal}
                onOpenChange={setShowLoginModal}
                title="Login to Create Events"
                description="Join the community to organize and share exciting educational events."
            />
        </div>
    );
}
