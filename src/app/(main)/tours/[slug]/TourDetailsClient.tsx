'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, DollarSign, Users, Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/components/auth/LoginModal';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const NovelEditor = dynamic(() => import('@/components/editor/NovelEditor'), { ssr: false });

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
    departureLocation: string;
    departureDateTime?: string;
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
    images?: string[];
    bannerUrl?: string;
    status: string;
    team?: {
        _id: string;
        name: string;
    };
    createdAt: string;
}

interface TourDetailsClientProps {
    initialTour: Tour;
    slug: string;
}

export default function TourDetailsClient({ initialTour, slug }: TourDetailsClientProps) {
    const { data: session, status } = useSession();
    const [tour, setTour] = useState<Tour>(initialTour);
    const [isJoining, setIsJoining] = useState(false);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = tour.images && tour.images.length > 0 
        ? tour.images 
        : (tour.bannerUrl ? [tour.bannerUrl] : []);

    // Clamp currentImageIndex if images length shrinks (e.g. after fresh data fetch)
    useEffect(() => {
        if (images.length > 0 && currentImageIndex >= images.length) {
            setCurrentImageIndex(Math.max(0, images.length - 1));
        } else if (images.length === 0 && currentImageIndex !== 0) {
            setCurrentImageIndex(0);
        }
    }, [images.length, currentImageIndex]);

    const fetchTourData = async () => {
        try {
            const response = await fetch(`/api/tours/slug/${slug}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Failed to fetch tour data:', response.status, errorData);
                return;
            }
            const data = await response.json();
            if (data?.tour || data) {
                setTour(data.tour || data);
            }
        } catch (error) {
            console.error('Error fetching tour:', error);
        }
    };

    const handleJoinTour = async () => {
        if (status === 'loading') return;
        if (!session) {
            setShowLoginModal(true);
            return;
        }
        setIsJoining(true);
        try {
            const response = await fetch(`/api/tours/${slug}/join`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                fetchTourData();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error joining tour:', error);
            toast.error('Failed to join tour');
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

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

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
                {/* Smart Image Slider */}
                <div className="relative h-64 md:h-96 bg-muted overflow-hidden group">
                    {images.length > 0 ? (
                        <>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentImageIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="relative h-full w-full"
                                >
                                    <Image
                                        src={images[currentImageIndex]}
                                        alt={`${tour.title} - ${currentImageIndex + 1}`}
                                        fill
                                        priority
                                        className="object-cover"
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {images.length > 1 && (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70 border-none"
                                        onClick={prevImage}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white hover:bg-black/70 border-none"
                                        onClick={nextImage}
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {images.map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                aria-label={`Go to image ${i + 1}`}
                                                aria-current={i === currentImageIndex ? 'true' : 'false'}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={`h-1.5 rounded-full transition-all ${
                                                    i === currentImageIndex ? 'bg-white w-8' : 'bg-white/40 w-4'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                                        {currentImageIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <MapPin className="h-24 w-24 text-white/30" />
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
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

                        <Button 
                            onClick={handleJoinTour} 
                            disabled={isJoining}
                            size="lg"
                            className="w-full md:w-auto"
                        >
                            {isJoining ? 'Joining...' : 'Join Tour'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Start Date</p>
                                <p className="font-semibold">{formatDate(tour.startDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">End Date</p>
                                <p className="font-semibold">{formatDate(tour.endDate)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Budget</p>
                                <p className="font-semibold">৳{tour.budget.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Participants</p>
                                <p className="font-semibold">{confirmedCount} confirmed</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/20 rounded-xl border border-dashed">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Departure From</p>
                                <p className="font-semibold">{tour.departureLocation}</p>
                            </div>
                        </div>
                        {tour.departureDateTime && (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Departure Time</p>
                                    <p className="font-semibold">
                                        {formatDate(tour.departureDateTime)} at {new Date(tour.departureDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-muted-foreground mb-6 leading-relaxed bg-muted/20 p-4 rounded-lg italic min-h-[100px]">
                        {(() => {
                            try {
                                const json = JSON.parse(tour.description);
                                return <NovelEditor initialValue={json} readOnly={true} onChange={() => {}} />;
                            } catch (e) {
                                return <span>&quot;{tour.description}&quot;</span>;
                            }
                        })()}
                    </div>

                    <div className="flex items-center gap-3 text-sm border-t pt-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {tour.organizer.image ? (
                                <Image src={tour.organizer.image} alt={tour.organizer.name} width={32} height={32} />
                            ) : (
                                <span className="text-xs font-bold">
                                    {tour.organizer.name?.trim()?.charAt(0) || '?'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-muted-foreground">Organized by</span>
                            <span className="font-bold text-foreground">{tour.organizer.name}</span>
                            {tour.team && (
                                <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                                        Team: {tour.team.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-lg shadow-sm border mb-4">
                <div className="flex overflow-x-auto p-1">
                    {['itinerary', 'participants'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-6 py-3 font-bold text-sm whitespace-nowrap transition-all rounded-md ${activeTab === tab
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'participants' && (
                                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                                    activeTab === tab ? 'bg-white/20' : 'bg-muted'
                                }`}>
                                    {tour.participants.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'itinerary' && (
                        <motion.div 
                            key="itinerary"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {tour.itinerary && tour.itinerary.length > 0 ? (
                                tour.itinerary.map((day) => (
                                    <div key={day.day} className="bg-card rounded-lg shadow-sm border p-6 hover:border-primary/50 transition-colors">
                                        <div className="flex items-start gap-6">
                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
                                                <span className="text-[10px] font-bold uppercase">Day</span>
                                                <span className="text-xl font-black">{day.day}</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-xl mb-1">{day.title}</h3>
                                                {day.location && (
                                                    <p className="text-sm text-primary flex items-center gap-1.5 mb-3 font-medium">
                                                        <MapPin className="h-4 w-4" />
                                                        {day.location}
                                                    </p>
                                                )}
                                                <p className="text-muted-foreground leading-relaxed">{day.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-card rounded-lg p-12 text-center text-muted-foreground border-2 border-dashed">
                                    No itinerary added yet
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'participants' && (
                        <motion.div 
                            key="participants"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-card rounded-lg shadow-sm border p-6"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                                <h3 className="font-bold text-xl">All Participants</h3>
                                <div className="flex gap-4 text-sm font-semibold">
                                    <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full">{confirmedCount} confirmed</span>
                                    {pendingCount > 0 && <span className="text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{pendingCount} pending</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tour.participants.map((participant) => (
                                    <div key={participant.user._id} className="flex items-center gap-4 p-3 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-black overflow-hidden shadow-sm">
                                            {participant.user.image ? (
                                                <Image src={participant.user.image} alt={participant.user.name} width={48} height={48} />
                                            ) : (
                                                participant.user.name?.trim()?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold">{participant.user.name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                Joined {formatDate(participant.joinedAt)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {getParticipantIcon(participant.status)}
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                participant.status === 'confirmed' ? 'text-green-600 bg-green-100' : 
                                                participant.status === 'pending' ? 'text-orange-600 bg-orange-100' : 'text-red-600 bg-red-100'
                                            }`}>
                                                {participant.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <LoginModal 
                open={showLoginModal} 
                onOpenChange={setShowLoginModal}
                title="Login to Join Tour"
                description="Join the community to plan and share exciting educational tours with others."
            />
        </div>
    );
}

