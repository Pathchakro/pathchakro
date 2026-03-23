'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Video, ArrowRight } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface Event {
    _id: string;
    title: string;
    slug?: string;
    startTime: string | Date;
    eventType: 'online' | 'offline';
    location?: string;
    roles?: {
        speakers?: {
            user?: {
                _id: string;
                name: string;
                image?: string;
            };
            topic?: string;
        }[];
    };
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
                    setEvents(data.events.slice(0, 1));
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
                    <h3 className="font-semibold text-sm tracking-tight">Upcoming Event</h3>
                </div>
                {events[0] && (
                    <Link
                        href={events[0].slug ? `/events/${events[0].slug}` : `/events/${events[0]._id}`}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group/join transition-all"
                    >
                        Join
                        <ArrowRight className="h-3.5 w-3.5 group-hover/join:translate-x-1 transition-transform" />
                    </Link>
                )}
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
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
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
                                            {formatTime(eventDate)}
                                        </span>
                                    </div>

                                    {(event.roles?.speakers?.length || 0) > 0 && (
                                        <div className="flex items-center">
                                            <AvatarGroup className="-ml-1.5 origin-left">
                                                {event.roles?.speakers?.map((speaker, sIndex) => (
                                                    <Tooltip
                                                        key={sIndex}
                                                        content={
                                                            <div className="flex flex-col gap-0.5">

                                                                <span className="text-primary-foreground font-bold">{speaker.topic || 'No topic'}</span>
                                                                <span className="text-primary-foreground/80 text-[10px] italic">-{speaker.user?.name || 'Unknown'}</span>
                                                            </div>
                                                        }
                                                    >
                                                        <Avatar className="h-8 w-8 border-2 border-background">
                                                            <AvatarImage src={speaker.user?.image} alt={speaker.user?.name} />
                                                            <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">{speaker.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                                        </Avatar>
                                                    </Tooltip>
                                                ))}
                                            </AvatarGroup>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t">
                <Link href="/events" className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all group/see-all">
                    See All Events
                    <ArrowRight className="h-3.5 w-3.5 group-hover/see-all:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
