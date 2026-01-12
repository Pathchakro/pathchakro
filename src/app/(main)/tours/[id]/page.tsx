'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, DollarSign, Users, Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
    participants: Array<{
        user: {
            _id: string;
            name: string;
            image?: string;
            rankTier: string;
        };
        status: string;
        joinedAt: string;
    }>;
    itinerary: Array<{
        day: number;
        title: string;
        description: string;
        location?: string;
    }>;
    status: string;
    team?: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

export default function TourDetailPage() {
    const params = useParams();
    const tourId = params.id as string;

    const [tour, setTour] = useState<Tour | null>(null);
    const [loading, setLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [activeTab, setActiveTab] = useState('itinerary');

    useEffect(() => {
        fetchTourData();
    }, [tourId]);

    const fetchTourData = async () => {
        try {
            const response = await fetch(`/api/tours/${tourId}`);
            const data = await response.json();

            if (data.tour) {
                setTour(data.tour);
            }
        } catch (error) {
            console.error('Error fetching tour:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTour = async () => {
        setIsJoining(true);
        try {
            const response = await fetch(`/api/tours/${tourId}/join`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                fetchTourData();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error joining tour:', error);
        } finally {
            setIsJoining(false);
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

    const getParticipantIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
            case 'declined': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    Loading tour...
                </div>
            </div>
        );
    }

    if (!tour) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Tour not found</h2>
                    <p className="text-muted-foreground mb-4">The tour you're looking for doesn't exist.</p>
                    <Link href="/tours">
                        <Button>Browse Tours</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const confirmedCount = tour.participants.filter(p => p.status === 'confirmed').length;
    const pendingCount = tour.participants.filter(p => p.status === 'pending').length;

    return (
        <div className="max-w-5xl mx-auto p-4">
            <Link href="/tours" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Tours
            </Link>

            {/* Tour Header */}
            <div className="bg-card rounded-lg shadow-sm border overflow-hidden mb-4">
                {/* Cover Image */}
                <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <MapPin className="h-24 w-24 text-white/30" />
                </div>

                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{tour.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(tour.status)}`}>
                                    {tour.status.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-lg text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {tour.destination}
                            </p>
                        </div>

                        <Button onClick={handleJoinTour} disabled={isJoining}>
                            {isJoining ? 'Joining...' : 'Join Tour'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Start Date</p>
                                <p className="font-medium">{formatDate(tour.startDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">End Date</p>
                                <p className="font-medium">{formatDate(tour.endDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Budget</p>
                                <p className="font-medium">৳{tour.budget.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Participants</p>
                                <p className="font-medium">{confirmedCount} confirmed</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{tour.description}</p>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Organized by</span>
                        <span className="font-medium text-foreground">{tour.organizer.name}</span>
                        {tour.team && (
                            <>
                                <span>•</span>
                                <span>Team: {tour.team.name}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-lg shadow-sm border mb-4">
                <div className="flex overflow-x-auto">
                    {['itinerary', 'participants'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'participants' && (
                                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                                    {tour.participants.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'itinerary' && (
                    <div className="space-y-4">
                        {tour.itinerary && tour.itinerary.length > 0 ? (
                            tour.itinerary.map((day) => (
                                <div key={day.day} className="bg-card rounded-lg shadow-sm border p-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {day.day}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-1">{day.title}</h3>
                                            {day.location && (
                                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                                    <MapPin className="h-3 w-3" />
                                                    {day.location}
                                                </p>
                                            )}
                                            <p className="text-sm text-muted-foreground">{day.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
                                No itinerary added yet
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">All Participants</h3>
                            <div className="flex gap-4 text-sm">
                                <span className="text-green-600">{confirmedCount} confirmed</span>
                                {pendingCount > 0 && <span className="text-orange-600">{pendingCount} pending</span>}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {tour.participants.map((participant) => (
                                <div key={participant.user._id} className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                        {participant.user.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{participant.user.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Joined {formatDate(participant.joinedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getParticipantIcon(participant.status)}
                                        <span className="text-xs capitalize">{participant.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
