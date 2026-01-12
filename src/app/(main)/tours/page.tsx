'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { MapPin, Calendar, DollarSign, Users, Plus, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

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

    useEffect(() => {
        fetchTours();
    }, [destinationFilter, statusFilter, showUpcoming]);

    const fetchTours = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (destinationFilter) params.append('destination', destinationFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (showUpcoming) params.append('upcoming', 'true');

            const response = await fetch(`/api/tours?${params}`);
            const data = await response.json();

            if (data.tours) {
                setTours(data.tours);
            }
        } catch (error) {
            console.error('Error fetching tours:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planning': return 'bg-blue-500';
            case 'confirmed': return 'bg-green-500';
            case 'ongoing': return 'bg-purple-500';
            case 'completed': return 'bg-gray-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            </div>

            {/* Tours List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading tours...
                </div>
            ) : tours.length === 0 ? (
                <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No tours found</h3>
                    <p className="text-muted-foreground mb-4">
                        {destinationFilter || statusFilter
                            ? 'Try adjusting your filters'
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
                            className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Tour Image Placeholder */}
                            <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                                <MapPin className="h-16 w-16 text-white/50" />
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

                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{tour.title}</h3>
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
