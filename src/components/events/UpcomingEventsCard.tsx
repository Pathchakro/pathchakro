'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Video, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Event {
    _id: string;
    title: string;
    slug?: string;
    startTime: string | Date;
    eventType: 'online' | 'offline';
    location?: string;
}

export function UpcomingEventsCard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('/api/events?upcoming=true');
                if (!response.ok) {
                    throw new Error(`Failed to fetch events: ${response.status}`);
                }
                const data = await response.json();
                if (data.events) {
                    setEvents(data.events.slice(0, 3));
                }
            } catch (error) {
                console.error('Error fetching upcoming events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border animate-pulse">
                <div className="h-5 w-32 bg-muted rounded mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-12 w-12 bg-muted rounded flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (events.length === 0) {
        return null; // Don't show the card if there are no upcoming events
    }

    return (
        <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Upcoming Events</h3>
                </div>
                <Link href="/events" className="text-xs text-primary hover:underline flex items-center gap-1">
                    See all
                </Link>
            </div>

            <div className="space-y-4">
                {events.map((event) => {
                    const eventDate = new Date(event.startTime);
                    const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event._id}`;

                    return (
                        <Link key={event._id} href={eventUrl} className="group block">
                            <div className="flex gap-3">
                                {/* Date Box */}
                                <div className="h-12 w-12 rounded bg-primary/10 flex flex-col items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <span className="text-[10px] uppercase font-bold text-primary">
                                        {eventDate.toLocaleString('en-US', { month: 'short' })}
                                    </span>
                                    <span className="text-lg font-bold leading-none text-primary">
                                        {eventDate.getDate()}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors leading-tight mb-1">
                                        {event.title}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                        {event.eventType === 'online' ? (
                                            <>
                                                <Video className="h-3 w-3 text-blue-500" />
                                                <span className="truncate">Online</span>
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="h-3 w-3 text-red-500" />
                                                <span className="truncate">{event.location || 'Offline'}</span>
                                            </>
                                        )}
                                        <span>•</span>
                                        <span className="truncate">
                                            {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <Link href="/events" className="mt-4 pt-3 border-t block text-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors group">
                Find more events <ArrowRight className="h-3 w-3 inline ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
}
