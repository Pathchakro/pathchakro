'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/auth/LoginModal';
import { Select } from '@/components/ui/select';
import { Calendar, MapPin, Users, Video, Plus, Clock, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EventCard } from '@/components/events/EventCard';
import LoadingSpinner from '@/components/ui/Loading';
import { Input } from '@/components/ui/input';
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
    slug: string;
    roles: {
        speakers: any[];
    };
    listeners: any[];
}

interface PaginationData {
    totalEvents: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export default function EventsClient({ initialData }: { initialData: { events: Event[], pagination: PaginationData } }) {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [events, setEvents] = useState<Event[]>(initialData.events);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [showUpcoming, setShowUpcoming] = useState(searchParams.get('upcoming') === 'true');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('q') || '');
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Refs for interaction tracking
    const isUserTypingRef = useRef(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(initialData.pagination.currentPage);
    const [totalPages, setTotalPages] = useState(initialData.pagination.totalPages);
    const [totalEvents, setTotalEvents] = useState(initialData.pagination.totalEvents);
    const [limit, setLimit] = useState(initialData.pagination.limit);

    // Update state if URL/initialData changes
    useEffect(() => {
        setEvents(initialData.events);
        setStatusFilter(searchParams.get('status') || '');
        setShowUpcoming(searchParams.get('upcoming') === 'true');
        
        // Only sync search query from URL if user is not actively typing
        if (!isUserTypingRef.current) {
            setSearchQuery(searchParams.get('q') || '');
        }
        
        setCurrentPage(Number.parseInt(searchParams.get('page') || '1', 10) || 1);
        setTotalPages(initialData.pagination.totalPages);
        setTotalEvents(initialData.pagination.totalEvents);
        setLimit(initialData.pagination.limit);
        setLoading(false);
        
        // Reset typing ref after sync
        isUserTypingRef.current = false;
    }, [initialData, searchParams]);

    const handleCreateEventClick = (e: React.MouseEvent) => {
        if (!session) {
            e.preventDefault();
            setShowLoginModal(true);
        }
    };

    const handleFilterChange = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('q', searchQuery);
        else params.delete('q');
        
        if (statusFilter) params.set('status', statusFilter);
        else params.delete('status');
        
        if (showUpcoming) params.set('upcoming', 'true');
        else params.delete('upcoming');
        
        params.set('page', '1');
        router.push(`/events?${params.toString()}`);
    }, [searchQuery, statusFilter, showUpcoming, searchParams, router]);

    // Live search/filter sync
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentQ = searchParams.get('q') || '';
            const currentStatus = searchParams.get('status') || '';
            const currentUpcoming = searchParams.get('upcoming') === 'true';

            if (searchQuery !== currentQ || statusFilter !== currentStatus || showUpcoming !== currentUpcoming) {
                handleFilterChange();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, showUpcoming, searchParams, handleFilterChange]);

    const onPageChange = (page: number) => {
        setLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`/events?${params.toString()}`);
    };

    const handleDelete = (deletedId: string) => {
        setEvents(prev => prev.filter(e => e._id !== deletedId));
    };

    return (
        <div className="max-w-6xl mx-auto p-4 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Events</h1>
                        <p className="text-muted-foreground font-medium mt-1">Discover and join educational meetups and workshops.</p>
                    </div>
                    <Link href="/events/create" onClick={handleCreateEventClick}>
                        <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2">
                            <Plus className="h-5 w-5" />
                            Create Event
                        </Button>
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-card border-2 p-6 rounded-3xl shadow-sm">
                    <div className="lg:col-span-2 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                isUserTypingRef.current = true;
                            }}
                            placeholder="Search events, topics, or participants..."
                            className="pl-12 h-12 bg-muted/30 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap gap-3">
                        <Select
                            value={statusFilter}
                            onChange={(e: any) => setStatusFilter(e.target.value)}
                            className="h-12 bg-muted/30 border-0 rounded-2xl font-bold flex-1"
                        >
                            <option value="">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                        </Select>

                        <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-2xl h-12 border-0 flex-1 md:flex-none">
                            <input
                                type="checkbox"
                                id="upcoming"
                                checked={showUpcoming}
                                onChange={(e) => setShowUpcoming(e.target.checked)}
                                className="h-5 w-5 rounded-lg accent-primary cursor-pointer"
                            />
                            <label htmlFor="upcoming" className="text-sm font-bold cursor-pointer select-none whitespace-nowrap">
                                Upcoming
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events List */}
            {loading ? (
                <div className="flex justify-center py-20">
                     <LoadingSpinner />
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-24 bg-card border-2 border-dashed rounded-[3rem]">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="h-10 w-10 text-muted-foreground opacity-50" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">No events found</h3>
                    <p className="text-muted-foreground font-medium mb-8 max-w-xs mx-auto">
                        {statusFilter || showUpcoming
                            ? 'Try adjusting your filters to find what you are looking for.'
                            : 'Be the first to organize an event for the community!'}
                    </p>
                    <Link href="/events/create" onClick={handleCreateEventClick}>
                        <Button className="rounded-xl px-8 h-12 font-bold">Create First Event</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {events.map((event) => (
                            <EventCard 
                                key={event._id} 
                                event={event} 
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col items-center gap-6 py-8">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                        />

                        <div className="text-sm font-bold text-muted-foreground bg-muted/50 px-6 py-2.5 rounded-2xl border-2">
                            Showing <span className="text-foreground">{((currentPage - 1) * limit) + 1}</span> to <span className="text-foreground">{Math.min(currentPage * limit, totalEvents)}</span> of <span className="text-foreground font-black">{totalEvents}</span> events
                        </div>
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
