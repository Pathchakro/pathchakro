'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MapPin, Calendar, DollarSign, Users, Plus, Search, Loader2, Heart } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from 'next-auth/react';

interface Tour {
    _id: string;
    organizer: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    title: string;
    destination: string;
    bannerUrl?: string;
    description: string;
    startDate: string;
    endDate: string;
    budget: number;
    participants: any[];
    status: string;
    createdAt: string;
}

export default function ToursPage() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [destinationFilter, setDestinationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showUpcoming, setShowUpcoming] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [savedTourIds, setSavedTourIds] = useState<string[]>([]);

    // Auth context would be better passed as prop or fetched if we were in a server component wrapper,
    // but here we are in a client component. We can fetch user's saved tours on mount if session exists.
    // However, `useSession` is the standard way in client components.
    // I need to import useSession.
    const { data: session } = useSession();

    useEffect(() => {
        fetchTours();
    }, [destinationFilter, statusFilter, showUpcoming, activeTab]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMyBookmarks();
        }
    }, [session?.user?.id]);

    const fetchMyBookmarks = async () => {
        try {
            const userRes = await fetch(`/api/users/${session?.user?.id || 'me'}`);
            const userData = await userRes.json();

            if (userData.user?.savedTours) {
                setSavedTourIds(userData.user.savedTours.map((t: any) => typeof t === 'string' ? t : t._id));
            }
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }
    };

    const fetchTours = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (destinationFilter) params.append('destination', destinationFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (showUpcoming) params.append('upcoming', 'true');
            if (activeTab === 'mine') params.append('filter', 'mine');
            if (activeTab === 'booked') params.append('filter', 'booked');
            if (activeTab === 'favorites') params.append('filter', 'favorites');

            const response = await fetch(`/api/tours?${params}`);
            const data = await response.json();

            if (data.tours) {
                setTours(data.tours);
            } else {
                setTours([]); // Clear if no tours
            }
        } catch (error) {
            console.error('Error fetching tours:', error);
        } finally {
            setLoading(false);
        }
    };

    // We'll use a ref to track in-flight requests properly without triggering re-renders
    // Using a ref specifically for this
    const inFlightRef = useRef<{ [key: string]: boolean }>({});

    const toggleBookmark = async (e: React.MouseEvent, tourId: string) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation();

        if (!session?.user) {
            alert('Please login to bookmark tours');
            return;
        }

        // Prevent duplicate requests
        if (inFlightRef.current[tourId]) return;
        inFlightRef.current[tourId] = true;

        const isCurrentlySaved = savedTourIds.includes(tourId);
        const optimisticAdded = !isCurrentlySaved;

        // Optimistic update using functional update
        setSavedTourIds(prev =>
            optimisticAdded
                ? [...prev, tourId]
                : prev.filter(id => id !== tourId)
        );

        try {
            const response = await fetch(`/api/tours/${tourId}/bookmark`, {
                method: 'POST',
            });
            if (!response.ok) {
                // Rollback using functional update
                setSavedTourIds(prev =>
                    optimisticAdded
                        ? prev.filter(id => id !== tourId) // Remove if we optimistically added
                        : [...prev, tourId] // Add back if we optimistically removed
                );
            }
        } catch (error) {
            console.error('Error bookmarking:', error);
            // Rollback using functional update
            setSavedTourIds(prev =>
                optimisticAdded
                    ? prev.filter(id => id !== tourId)
                    : [...prev, tourId]
            );
        } finally {
            delete inFlightRef.current[tourId];
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Tours & Trips</h1>
                        <p className="text-muted-foreground">Plan and join educational tours</p>
                    </div>
                    <Link href="/tours/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Tour
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={destinationFilter}
                            onChange={(e) => setDestinationFilter(e.target.value)}
                            placeholder="Search destination..."
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="planning">Planning</option>
                        <option value="confirmed">Confirmed</option>
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
                            Show upcoming tours only
                        </label>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All Tours</TabsTrigger>
                        <TabsTrigger value="mine" disabled={!session?.user}>My Tours</TabsTrigger>
                        <TabsTrigger value="booked" disabled={!session?.user}>Booked</TabsTrigger>
                        <TabsTrigger value="favorites" disabled={!session?.user}>Favourites</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Tours List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    <div className="flex justify-center mb-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    Loading tours...
                </div>
            ) : tours.length === 0 ? (
                <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No tours found</h3>
                    <p className="text-muted-foreground mb-4">
                        {destinationFilter || statusFilter || activeTab !== 'all'
                            ? 'Try adjusting your filters or tabs'
                            : 'Be the first to create a tour!'}
                    </p>
                    <Link href="/tours/create">
                        <Button>Create Tour</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tours.map((tour) => (
                        <Link
                            key={tour._id}
                            href={`/tours/${tour._id}`}
                            className="group bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all relative block"
                        >
                            {/* Bookmark Button */}
                            {session?.user && (
                                <button
                                    onClick={(e) => toggleBookmark(e, tour._id)}
                                    className="absolute top-2 right-2 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background transition-colors"
                                    aria-label={savedTourIds.includes(tour._id) ? "Remove from favorites" : "Add to favorites"}
                                >
                                    <Heart
                                        className={`h-5 w-5 transition-colors ${savedTourIds.includes(tour._id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                                    />
                                </button>
                            )}
                            {/* Tour Image Placeholder */}
                            <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center relative overflow-hidden">
                                {tour.bannerUrl ? (
                                    <img src={tour.bannerUrl} alt={tour.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                ) : (
                                    <MapPin className="h-16 w-16 text-white/50" />
                                )}
                            </div>

                            <div className="p-4">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(tour.status)}`}>
                                        {tour.status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(tour.startDate)}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">{tour.title}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                    <MapPin className="h-3 w-3" />
                                    {tour.destination}
                                </p>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {tour.description}
                                </p>

                                <div className="flex items-center justify-between text-sm pt-3 border-t">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{tour.participants.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <DollarSign className="h-4 w-4" />
                                        <span>৳{tour.budget.toLocaleString()}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground mt-2">
                                    By {tour.organizer.name}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'planning': return 'bg-yellow-500';
        case 'confirmed': return 'bg-green-500';
        case 'ongoing': return 'bg-blue-500';
        case 'completed': return 'bg-gray-500';
        default: return 'bg-gray-400';
    }
}
