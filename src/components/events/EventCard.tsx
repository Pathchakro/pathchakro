import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Users, Video, MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, Mic, Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareDialog } from '@/components/feed/ShareDialog';
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';

interface EventCardProps {
    event: {
        _id: string;
        title: string;
        slug?: string;
        description: string;
        status: string;
        startTime: string | Date;
        endTime: string | Date;
        eventType: string;
        location?: string;
        meetingLink?: string;
        banner?: string;
        organizer: {
            _id: string;
            name: string;
            image?: string;
        };
        team?: {
            name: string;
        };
        roles: {
            speakers: any[];
        };
        listeners: any[];
    };
    onDelete?: (id: string) => void;
}

export function EventCard({ event, onDelete }: EventCardProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false); // Added state for isDeleting
    const isOwner = session?.user?.id === event.organizer._id;
    const isAdmin = session?.user?.role === 'admin';
    const canEdit = isOwner || isAdmin;
    const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event._id}`;

    const handleJoin = async () => {
        if (!session) {
            toast.error("Please login to join the event");
            return;
        }

        if (event.status === 'cancelled' || event.status === 'completed') {
            toast.error("This event is no longer accepting participants");
            return;
        }

        const alreadyJoined = (event.listeners || []).some(
            (listener: any) => {
                const userId = listener.user?._id || listener.user || listener._id;
                return userId === session.user?.id;
            }
        );
        if (alreadyJoined) {
            toast.info("You have already joined this event");
            return;
        }

        try {
            const response = await fetch(`/api/events/${event._id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'listener' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to join event');
            }

            toast.success("Successfully joined the event!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        }
    };
    const handleDeleteEvent = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this event? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))'
        });

        if (!result.isConfirmed) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/events/${event._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete event');
            }

            toast.success('Event deleted successfully');
            if (onDelete) {
                onDelete(event._id);
            } else {
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred while deleting');
        }
    };

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
        <div className="bg-card rounded-lg shadow-sm p-4 mb-4 border">
            {/* Header: Author Info */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    {event.organizer.image ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden relative">
                            <Image
                                src={event.organizer.image}
                                alt={event.organizer.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                            {event.organizer.name[0]}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">{event.organizer.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(event.startTime)} • Event
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Link href={eventUrl} className="w-full">View Details</Link>
                        </DropdownMenuItem>
                        {canEdit && (
                            <>
                                <DropdownMenuItem>
                                    <Link href={`${eventUrl}/edit`} className="w-full">Edit Event</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                    onClick={handleDeleteEvent}
                                >
                                    Delete Event
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Content Body */}
            <div className="mb-4">
                <Link href={eventUrl} className="block relative group">
                    <div className="mb-3 rounded-lg overflow-hidden relative aspect-video w-full">
                        <Image
                            src={event.banner || "/OG2_pathchakro.png"}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end z-10">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shadow-md uppercase tracking-wider backdrop-blur-md bg-background/80 ${getStatusColor(event.status).replace('bg-', 'text-').replace('text-', 'text-')}`}>
                                {event.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mb-2 gap-2">
                        <h3 className="text-xl font-bold hover:text-primary transition-colors line-clamp-2">
                            {event.title}
                        </h3>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleJoin();
                            }}
                            aria-label="Join"
                            className="flex-shrink-0 flex items-center cursor-pointer gap-1.5 px-4 py-1.5 rounded-full bg-[#f97316] text-white hover:bg-[#ea580c] transition-all shadow-sm text-sm font-semibold"
                        >
                            <Users className="h-4 w-4" />
                            Join
                        </button>
                    </div>


                    <div className="bg-accent/10 rounded-lg p-3.5 border border-border/50 text-sm">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-1">
                            {/* Row 1: Date | Time */}
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Date
                                </span>
                                <span className="font-bold text-sm truncate">{formatDate(event.startTime)}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Time
                                </span>
                                <span className="font-bold text-sm truncate">
                                    {formatTime(event.startTime)}
                                </span>
                            </div>

                            {/* Row 2: Status | Participants */}
                            <div className="pt-2.5 border-t border-border/20 flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    {event.eventType === 'online' ? (
                                        <Video className="h-3 w-3" />
                                    ) : (
                                        <MapPin className="h-3 w-3" />
                                    )}
                                    Status
                                </span>
                                {event.eventType === 'online' ? (
                                    <span className="text-blue-600 font-bold text-sm truncate">Online Event</span>
                                ) : (
                                    <span className="font-bold text-sm truncate">{event.location}</span>
                                )}
                            </div>
                            <div className="pt-2.5 border-t border-border/20 flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Audience
                                </span>
                                <span className="text-[#2563eb] font-bold text-sm truncate">
                                    {(() => {
                                        const listenerCount = (event.listeners || []).filter(
                                            (l: any) => !event.roles?.speakers?.some((s: any) => (s.user?._id || s.user) === (l.user?._id || l.user))
                                        ).length;
                                        return `${listenerCount} ${listenerCount === 1 ? 'Participant' : 'Participants'}`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Stats & Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex flex-col gap-1 origin-left">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                        <Mic className="h-3 w-3" />
                        Speaker
                    </span>
                    {/* Speaker Avatars Group */}
                    {(event.roles?.speakers?.length ?? 0) > 0 && (
                        <AvatarGroup>
                            {event.roles.speakers.slice(0, 5).map((speaker: any, i: number) => {
                                const user = speaker.user || {};
                                return (
                                    <Tooltip
                                        key={user._id || i}
                                        content={
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold">{speaker.topic || 'No topic'}</span>
                                                <span className="text-[10px] opacity-80 italic">-{user.name || 'Unknown'}</span>
                                            </div>
                                        }
                                    >
                                        <Avatar className="h-7 w-7 border-2 border-background">
                                            <AvatarImage src={user.image} alt={user.name} />
                                            <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">
                                                {(user.name || "?")[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Tooltip>
                                );
                            })}
                        </AvatarGroup>
                    )}
                </div>

                <div className="flex gap-2">
                    <ShareDialog
                        basePath="/events"
                        post={{
                            _id: event._id,
                            title: event.title,
                            slug: event.slug,
                            description: event.description
                        }}
                        trigger={
                            <button
                                aria-label="Share"
                                className="p-1.5 rounded-full cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Share2 className="h-4 w-4" />
                            </button>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
