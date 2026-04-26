'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/auth/LoginModal';
import { Select } from '@/components/ui/select';
import { Calendar, MapPin, Users, Video, Plus, Clock, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventCard } from '@/components/events/EventCard';
import LoadingSpinner from '@/components/ui/Loading';
import { Input } from '@/components/ui/input';
import { useRef } from 'react';
import { Pagination } from '@/components/ui/Pagination';


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
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEvents, setTotalEvents] = useState(0);

    const prevStatusRef = useRef(statusFilter);
    const prevUpcomingRef = useRef(showUpcoming);
    const prevSearchRef = useRef(debouncedSearchQuery);

    const handleCreateEventClick = (e: React.MouseEvent) => {
        if (!session) {
            e.preventDefault();
            setShowLoginModal(true);
        }
    };

    const fetchEvents = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '10');
            
            if (statusFilter) params.append('status', statusFilter);
            if (showUpcoming) params.append('upcoming', 'true');
            if (debouncedSearchQuery) params.append('q', debouncedSearchQuery);

            const response = await fetch(`/api/events?${params}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch events: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.events) {
                setEvents(data.events);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalEvents(data.pagination.totalEvents);
                }
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, showUpcoming, debouncedSearchQuery]);

    const handleDelete = (deletedId: string) => {
        setEvents(prev => prev.filter(e => e._id !== deletedId));
    };

    useEffect(() => {
        if (isFirstLoad) {
            setIsFirstLoad(false);
            // Even on first load, we might want to fetch if we want pagination info
            // But let's follow the books page pattern where it resets/fetches on change
        }

        const filtersChanged = 
            prevStatusRef.current !== statusFilter || 
            prevUpcomingRef.current !== showUpcoming || 
            prevSearchRef.current !== debouncedSearchQuery;

        if (filtersChanged) {
            prevStatusRef.current = statusFilter;
            prevUpcomingRef.current = showUpcoming;
            prevSearchRef.current = debouncedSearchQuery;

            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchEvents(1);
            }
        } else {
            fetchEvents(currentPage);
        }
    }, [fetchEvents, currentPage, statusFilter, showUpcoming, debouncedSearchQuery, isFirstLoad]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/20 p-4 rounded-xl border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value && showUpcoming) {
                                    setShowUpcoming(false);
                                }
                            }}
                            placeholder="Search events, topics, or participants..."
                            className="pl-10 h-11 bg-background"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                        <Select
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                            className="h-11 bg-card flex-1"
                        >
                            <option value="">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </Select>

                        <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-md border h-11">
                            <input
                                type="checkbox"
                                id="upcoming"
                                checked={showUpcoming}
                                onChange={(e) => setShowUpcoming(e.target.checked)}
                                className="rounded"
                            />
                            <label htmlFor="upcoming" className="text-sm cursor-pointer select-none whitespace-nowrap">
                                Upcoming only
                            </label>
                        </div>
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
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {events.map((event) => (
                            <EventCard 
                                key={event._id} 
                                event={event as any} 
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col items-center gap-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />

                        <p className="text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full border">
                            Showing <span className="text-foreground">{((currentPage - 1) * 10) + 1}</span> to <span className="text-foreground">{Math.min(currentPage * 10, totalEvents)}</span> of <span className="text-foreground font-bold">{totalEvents}</span> events
                        </p>
                    </div>
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
