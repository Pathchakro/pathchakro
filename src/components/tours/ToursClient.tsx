'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select-radix';
import { MapPin, DollarSign, Users, Plus, Search, Heart, Calendar, ArrowRight } from 'lucide-react';
import { formatDate, extractPlainText } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/components/auth/LoginModal';
import { ImageSlider } from '@/components/tours/ImageSlider';

interface Tour {
    _id: string;
    slug?: string;
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
    images?: string[];
}

export default function ToursClient({ initialTours }: { initialTours: Tour[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const [destinationFilter, setDestinationFilter] = useState(searchParams.get('destination') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [showUpcoming, setShowUpcoming] = useState(searchParams.get('upcoming') === 'true');
    const [activeTab, setActiveTab] = useState(searchParams.get('filter') || 'all');
    const [savedTourIds, setSavedTourIds] = useState<string[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);

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

    const handleFilterChange = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (destinationFilter) params.set('destination', destinationFilter);
        else params.delete('destination');

        if (statusFilter !== 'all') params.set('status', statusFilter);
        else params.delete('status');

        if (showUpcoming) params.set('upcoming', 'true');
        else params.delete('upcoming');

        if (activeTab !== 'all') params.set('filter', activeTab);
        else params.delete('filter');

        router.push(`/tours?${params.toString()}`);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange();
        }, 500);
        return () => clearTimeout(timer);
    }, [destinationFilter, statusFilter, showUpcoming, activeTab]);

    const inFlightRef = useRef<{ [key: string]: boolean }>({});

    const toggleBookmark = async (e: React.MouseEvent, tourId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!session?.user) {
            toast.error('Please login to bookmark tours');
            return;
        }

        if (inFlightRef.current[tourId]) return;
        inFlightRef.current[tourId] = true;

        const isCurrentlySaved = savedTourIds.includes(tourId);
        const optimisticAdded = !isCurrentlySaved;

        setSavedTourIds(prev =>
            optimisticAdded ? [...prev, tourId] : prev.filter(id => id !== tourId)
        );

        try {
            const response = await fetch(`/api/tours/${tourId}/bookmark`, { method: 'POST' });
            if (!response.ok) {
                toast.error('Failed to update bookmark');
                setSavedTourIds(prev => optimisticAdded ? prev.filter(id => id !== tourId) : [...prev, tourId]);
            }
        } catch (error) {
            toast.error('An error occurred while updating bookmark');
            setSavedTourIds(prev => optimisticAdded ? prev.filter(id => id !== tourId) : [...prev, tourId]);
        } finally {
            delete inFlightRef.current[tourId];
        }
    };

    return (
        <div className="container max-w-6xl py-10 space-y-10">
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl">Tours & Trips</h1>

                    </div>
                    <Link href="/tours/create">
                        <Button size="lg" className="rounded-2xl font-black shadow-lg hover:shadow-xl transition-all" onClick={(e) => {
                            if (!session) { e.preventDefault(); setShowLoginModal(true); }
                        }}>
                            <Plus className="mr-2 h-5 w-5" /> Create New Tour
                        </Button>
                    </Link>
                </div>

                <div className="bg-card border-2 p-6 rounded-3xl shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={destinationFilter}
                                onChange={(e) => setDestinationFilter(e.target.value)}
                                placeholder="Search destination..."
                                className="pl-12 h-12 rounded-2xl border-2 focus-visible:ring-primary font-bold shadow-inner bg-muted/20"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12 rounded-2xl border-2 font-bold bg-muted/20 hover:bg-muted/30 transition-all">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 shadow-xl">
                                <SelectItem value="all" className="font-bold">All Status</SelectItem>
                                <SelectItem value="planning" className="font-bold">Planning</SelectItem>
                                <SelectItem value="confirmed" className="font-bold">Confirmed</SelectItem>
                                <SelectItem value="ongoing" className="font-bold">Ongoing</SelectItem>
                                <SelectItem value="completed" className="font-bold">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-3 bg-muted/20 px-4 rounded-2xl border-2 border-transparent hover:border-primary/20 transition-all">
                            <input
                                type="checkbox"
                                id="upcoming"
                                checked={showUpcoming}
                                onChange={(e) => setShowUpcoming(e.target.checked)}
                                className="h-5 w-5 rounded-lg border-2 text-primary focus:ring-primary transition-all"
                            />
                            <label htmlFor="upcoming" className="text-sm font-black uppercase tracking-tight cursor-pointer select-none">
                                Upcoming tours only
                            </label>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-11 bg-muted/50 p-1 rounded-2xl border-2">
                            <TabsTrigger value="all" className="rounded-xl font-bold">Explore</TabsTrigger>
                            <TabsTrigger value="mine" disabled={!session?.user} className="rounded-xl font-bold">My Managed</TabsTrigger>
                            <TabsTrigger value="booked" disabled={!session?.user} className="rounded-xl font-bold">My Booked</TabsTrigger>
                            <TabsTrigger value="favorites" disabled={!session?.user} className="rounded-xl font-bold">Wishlist</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {initialTours.length === 0 ? (
                <div className="text-center py-24 bg-card border-2 border-dashed rounded-3xl animate-in fade-in zoom-in duration-500">
                    <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MapPin className="h-12 w-12 text-primary/30" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">No Tours Discovered</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-8">Try adjusting your filters or be the first to organize a trip to this destination!</p>
                    <Link href="/tours/create">
                        <Button size="lg" className="rounded-2xl font-black shadow-lg" onClick={(e) => { if (!session) { e.preventDefault(); setShowLoginModal(true); } }}>
                            Create Tour Now
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {initialTours.map((tour) => (
                        <div key={tour._id} className="group relative bg-card border-2 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-primary/20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
                            {session?.user && (
                                <button
                                    onClick={(e) => toggleBookmark(e, tour._id)}
                                    className="absolute top-4 right-4 z-20 p-3 bg-background/60 backdrop-blur-md rounded-2xl shadow-lg hover:bg-background hover:scale-110 transition-all border-2"
                                    aria-label={savedTourIds.includes(tour._id) ? "Remove from wishlist" : "Add to wishlist"}
                                    aria-pressed={savedTourIds.includes(tour._id)}
                                >
                                    <Heart className={`h-5 w-5 transition-colors ${savedTourIds.includes(tour._id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                                </button>
                            )}

                            <div className="relative overflow-hidden">
                                <ImageSlider images={tour.images && tour.images.length > 0 ? tour.images : (tour.bannerUrl ? [tour.bannerUrl] : [])} title={tour.title} aspectRatio="aspect-video" />
                                <div className="absolute top-4 left-4 z-10 flex gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white shadow-lg ${getStatusColor(tour.status)}`}>
                                        {tour.status}
                                    </span>
                                </div>
                            </div>

                            <Link href={`/tours/${tour.slug || tour._id}`} className="block p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <Calendar className="h-3 w-3 text-primary" />
                                        {formatDate(tour.startDate)}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                        <DollarSign className="h-3 w-3" />
                                        ৳{tour.budget.toLocaleString()}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-1">{tour.title}</h3>

                                <div className="flex items-center gap-1 text-sm font-bold text-muted-foreground mb-4">
                                    <MapPin className="h-4 w-4 text-red-500" />
                                    {tour.destination}
                                </div>

                                <p className="text-sm text-muted-foreground font-medium line-clamp-2 mb-6 h-10 leading-relaxed">
                                    {extractPlainText(tour.description)}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Users className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-black">{tour.participants.length} <span className="text-muted-foreground font-medium">Joined</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organizer</p>
                                            <p className="text-xs font-bold">{tour.organizer.name}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary border-2 border-primary/10">
                                            <ArrowRight className="h-5 w-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
            <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} title="Login Required" />
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'planning': return 'bg-amber-500';
        case 'confirmed': return 'bg-emerald-500';
        case 'ongoing': return 'bg-sky-500';
        case 'completed': return 'bg-zinc-500';
        default: return 'bg-zinc-400';
    }
}
