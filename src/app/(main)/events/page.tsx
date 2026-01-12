'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Calendar, MapPin, Users, Video, Plus, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

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
    endTime: string;
    status: string;
    roles: {
        lecturers: any[];
    };
    listeners: any[];
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showUpcoming, setShowUpcoming] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, [statusFilter, showUpcoming]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (showUpcoming) params.append('upcoming', 'true');

            const response = await fetch(`/api/events?${params}`, { cache: 'no-store' });
            const data = await response.json();

            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
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

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Events</h1>
                        <p className="text-muted-foreground">Educational events and meetups</p>
                    </div>
                    <Link href="/events/create">
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
                        onChange={(e) => setStatusFilter(e.target.value)}
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
                <div className="text-center py-12 text-muted-foreground">
                    Loading events...
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
                    <Link href="/events/create">
                        <Button>Create Event</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => {
                        const totalParticipants = event.roles.lecturers.length + event.listeners.length + 5; // max special roles

                        return (
                            <Link
                                key={event._id}
                                href={`/events/${event._id}`}
                                className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {event.description}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${getStatusColor(event.status)}`}>
                                        {event.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm mb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(event.startTime)}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            {' - '}
                                            {new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {event.eventType === 'online' ? (
                                        <div className="flex items-center gap-2">
                                            <Video className="h-4 w-4 text-blue-500" />
                                            <span className="text-blue-600">Online Event</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-green-500" />
                                            <span>{event.location}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{event.listeners.length} listeners</span>
                                        {event.roles.lecturers.length > 0 && (
                                            <span className="text-muted-foreground">• {event.roles.lecturers.length} lecturers</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                                    <span>By {event.organizer.name}</span>
                                    {event.team && <span>Team: {event.team.name}</span>}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
