'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Video, Users, Clock, ArrowLeft, User } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/components/auth/LoginModal';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { generateHtml } from '@/lib/server-html';
import Swal from 'sweetalert2';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/ui/Loading';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MoreVertical, Trash2, Mic, Users as UsersIcon, UserPlus, MoreHorizontal, Edit } from 'lucide-react';

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
    banner?: string;
    roles: {
        speakers: Array<{
            user: { _id: string; name: string; image?: string };
            topic: string;
            duration?: number;
            order: number;
        }>;
    };
    listeners: Array<{
        user: { _id: string; name: string; image?: string };
    }>;
    createdAt: string;
}
export default function EventDetailClient({ slug, initialData }: { slug: string; initialData?: Event }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [isJoining, setIsJoining] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [lectureTopic, setLectureTopic] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    useEffect(() => {
        if (!initialData) {
            fetchEvent();
        }
    }, [slug, initialData]);

    const fetchEvent = async () => {
        try {
            // Options 'cache' and 'next.tags' are removed as they are server-side only
            const response = await fetch(`/api/events/${slug}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.event) {
                setEvent(data.event);
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRole = async () => {
        if (!event) return;

        if (!session) {
            setShowLoginModal(true);
            return;
        }

        if (!selectedRole) {
            toast.error('Please select a role');
            return;
        }

        if (selectedRole === 'speaker' && !lectureTopic.trim()) {
            toast.error('Please enter your topic');
            return;
        }

        setIsJoining(true);
        try {
            const response = await fetch(`/api/events/${event._id}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: selectedRole,
                    topic: lectureTopic || undefined,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                setSelectedRole('');
                setLectureTopic('');
                setIsRegisterOpen(false);
                fetchEvent();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error joining event:', error);
            toast.error('Failed to register. Please try again.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleCancelParticipation = async () => {
        if (!event || !session) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You want to cancel your participation?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, cancel it!',
            background: 'var(--card)',
            color: 'var(--foreground)'
        });

        if (!result.isConfirmed) {
            return;
        }

        setIsJoining(true);
        try {
            const response = await fetch(`/api/events/${event._id}/join`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                setIsRegisterOpen(false);
                fetchEvent();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error cancelling participation:', error);
            toast.error('Failed to cancel participation. Please try again.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!event) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this event? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: 'var(--card)',
            color: 'var(--foreground)'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/events/${event._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete event');
            }

            toast.success('Event deleted successfully');
            router.push('/events');
        } catch (error: any) {
            toast.error(error.message || 'An error occurred while deleting');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <LoadingSpinner />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Event not found</h2>
                    <Link href="/events">
                        <Button>Back to Events</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const availableRoles = [
        { id: 'speaker', label: 'Speaker', taken: (event.roles?.speakers?.length || 0) >= 5 },
        { id: 'listener', label: 'Listener', taken: false },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4">
            <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Events
            </Link>

            {/* Event Header */}
            <div className="bg-card rounded-lg shadow-sm border p-6 mb-4">
                <div className="mb-6 rounded-xl overflow-hidden w-full aspect-[1200/630] relative shadow-inner bg-muted">
                    <Image
                        src={event.banner || "/OG_pathchakro.png"}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {(session?.user?.id === event.organizer._id || session?.user?.role === 'admin') && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-white hover:text-white/80 p-1.5 transition-all">
                                        <MoreHorizontal className="h-6 w-6" />
                                    </button>
                                </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/events/${slug}/edit`} className="w-full flex items-center cursor-pointer">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Event
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 cursor-pointer flex items-center"
                                    onClick={handleDeleteEvent}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Event
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                </div>

                <div className="flex items-start justify-between mb-4 gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl sm:text-3xl font-bold mb-2 break-words leading-tight">{event.title}</h1>
                        <div
                            className="text-sm sm:text-base text-muted-foreground prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: generateHtml(event.description) }}
                        />
                    </div>
                    <span className={`px-2 py-1 h-fit rounded-full text-xs sm:text-sm font-medium ${event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                        event.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                            event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                'bg-red-100 text-red-700'
                        }`}>
                        {event.status.toUpperCase()}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-y-6 gap-x-4">
                    <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Date</p>
                            <p className="text-sm font-semibold">{formatDate(event.startTime)}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Time</p>
                            <p className="text-sm font-semibold leading-tight">
                                {event.startTime ? formatTime(event.startTime) : 'TBA'}
                            </p>
                        </div>
                    </div>

                    {event.eventType === 'online' ? (
                        <div className="flex items-start gap-2">
                            <Video className="h-4 w-4 mt-0.5 text-blue-500" />
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Meeting</p>
                                <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:underline">
                                    Join Online
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-green-500" />
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Location</p>
                                <p className="text-sm font-semibold break-words leading-tight">{event.location}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Participants</p>
                            <p className="text-sm font-semibold">{
                                (event.listeners || []).filter(l => {
                                    const lId = (l.user?._id || l.user)?.toString();
                                    return !event.roles?.speakers?.some(s => (s.user?._id || s.user)?.toString() === lId);
                                }).length
                            } joined</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Created by <span className="font-medium text-foreground">{event.organizer?.name || 'Unknown'}</span>
                        {event.team && <><br className="sm:hidden" /> • Team: <span className="font-medium text-foreground">{event.team.name}</span></>}
                    </p>

                    {(() => {
                        const isSpeaker = event.roles?.speakers?.some(s => (s.user?._id || s.user)?.toString() === session?.user?.id);
                        const isListener = event.listeners?.some(l => (l.user?._id || l.user)?.toString() === session?.user?.id);
                        const isRegistered = isSpeaker || isListener;

                        if (isRegistered) {
                            return (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto gap-2 border border-primary shadow-sm font-semibold h-10 px-6 opacity-70 cursor-not-allowed"
                                    disabled={true}
                                >
                                    <User className="h-4 w-4" />
                                    Registered
                                </Button>
                            );
                        }

                        return (
                            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="w-full sm:w-auto gap-2 shadow-sm font-semibold h-10 px-6">
                                        <UserPlus className="h-4 w-4" />
                                        Register Now
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold">Register for Event</DialogTitle>
                                        <DialogDescription>
                                            Select your role and join the discussion in this community meetup.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 pt-4">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="role">Choose Your Role</Label>
                                                <select
                                                    id="role"
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="w-full px-4 py-3 bg-background border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="">Select a role...</option>
                                                    {availableRoles.map((role) => (
                                                        <option key={role.id} value={role.id} disabled={role.taken}>
                                                            {role.label} {role.taken && '(Taken)'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedRole === 'speaker' && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                                                    <Label htmlFor="topic">What is your topic? *</Label>
                                                    <Input
                                                        id="topic"
                                                        value={lectureTopic}
                                                        onChange={(e) => setLectureTopic(e.target.value)}
                                                        placeholder="Enter your topic name..."
                                                        className="py-6 px-4 text-lg"
                                                    />
                                                </div>
                                            )}

                                            <Button
                                                onClick={handleJoinRole}
                                                disabled={!selectedRole || isJoining}
                                                className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                            >
                                                {isJoining ? 'Processing...' : 'Confirm Registration'}
                                            </Button>

                                            <p className="text-xs text-center text-muted-foreground">
                                                Note: You can only register for one role per event.
                                            </p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        );
                    })()}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="max-w-3xl mx-auto space-y-6">
                <Tabs defaultValue="speakers" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="speakers" className="flex items-center gap-2">
                            <Mic className="h-4 w-4" />
                            Speakers ({(event.roles?.speakers?.length || 0)})
                        </TabsTrigger>
                        <TabsTrigger value="listeners" className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" />
                            Listeners ({(event.listeners || []).filter(l => {
                                const lId = (l.user?._id || l.user)?.toString();
                                return !event.roles?.speakers?.some(s => (s.user?._id || s.user)?.toString() === lId);
                            }).length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="speakers" className="space-y-4">
                        {(event.roles?.speakers?.length || 0) > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {(event.roles?.speakers || []).map((speaker) => (
                                    <div key={speaker.user?._id || `${speaker.user?.name}-${speaker.topic}`} className="bg-card rounded-xl border p-4 sm:p-6 shadow-sm hover:shadow-md transition-all relative">
                                        <div className="flex items-start gap-4 sm:gap-6">
                                            <Avatar className="h-14 w-14 sm:h-20 sm:w-20 border-2 border-primary flex-shrink-0">
                                                <AvatarImage src={speaker.user?.image} alt={speaker.user?.name} />
                                                <AvatarFallback className="text-lg sm:text-xl">{speaker.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0 pr-4 sm:pr-0">
                                                <p className="text-lg sm:text-2xl font-bold text-primary leading-tight break-words">
                                                    {speaker.topic}
                                                </p>
                                                <p className="text-sm italic text-muted-foreground mt-1">
                                                    by {speaker.user?.name || 'Unknown'}
                                                </p>
                                            </div>

                                            {session?.user?.id === speaker.user?._id && (
                                                <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-full">
                                                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={handleCancelParticipation}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Cancel Participation
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">No speakers registered yet</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="listeners" className="space-y-4">
                        {((event.listeners || []).filter(l => {
                            const lId = (l.user?._id || l.user)?.toString();
                            return !event.roles?.speakers?.some(s => (s.user?._id || s.user)?.toString() === lId);
                        }).length) > 0 ? (
                            <div className="bg-card rounded-xl border divide-y overflow-hidden">
                                {(event.listeners || [])
                                    .filter(l => {
                                        const lId = (l.user?._id || l.user)?.toString();
                                        return !event.roles?.speakers?.some(s => (s.user?._id || s.user)?.toString() === lId);
                                    })
                                    .map((listener, i) => (
                                        <div key={listener.user?._id || `listener-${i}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={listener.user?.image} alt={listener.user?.name} />
                                                    <AvatarFallback>{listener.user?.name?.charAt(0) || 'L'}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{listener.user?.name || 'Anonymous'}</span>
                                            </div>

                                            {session?.user?.id === listener.user?._id && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={handleCancelParticipation}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Cancel Participation
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <p className="text-muted-foreground">Be the first to join as a listener!</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

            </div>
            <LoginModal
                open={showLoginModal}
                onOpenChange={setShowLoginModal}
                title="Login to Join Event"
                description="Join the community to participate in exciting educational events and meetups."
            />
        </div>
    );
}

