import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Video, MoreHorizontal, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            lecturers: any[];
        };
        listeners: any[];
    };
    onDelete?: (id: string) => void;
}

export function EventCard({ event, onDelete }: EventCardProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const isOwner = session?.user?.id === event.organizer._id;
    const isAdmin = session?.user?.role === 'admin';
    const canEdit = isOwner || isAdmin;
    const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event._id}`;

    const handleJoin = async () => {
        if (!session) {
            toast.error("Please login to join the event");
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

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

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
                        <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img
                                src={event.organizer.image}
                                alt={event.organizer.name}
                                className="h-full w-full object-cover"
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
                                    onClick={handleDelete}
                                >
                                    Delete Event
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Content Body */}
            {/* Content Body */}
            <div className="mb-4">
                <Link href={eventUrl}>
                    {event.banner && (
                        <div className="mb-3 rounded-lg overflow-hidden relative aspect-video w-full">
                            <img
                                src={event.banner}
                                alt={event.title}
                                className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold hover:text-primary transition-colors">
                            {event.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${getStatusColor(event.status)}`}>
                            {event.status.toUpperCase()}
                        </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {event.description}
                    </p>

                    <div className="bg-accent/10 rounded-md p-3 space-y-2 text-sm border">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(event.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                                {new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {event.eventType === 'online' ? (
                            <div className="flex items-center gap-2">
                                <Video className="h-4 w-4 text-blue-500" />
                                <span className="text-blue-600">Online Event</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-green-500" />
                                <span>{event.location}</span>
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            {/* Stats (Placeholder for now since we don't have likes/comments on events yet) */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3 pb-3 border-b">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event.listeners.length} listeners</span>
                </div>
                <div className="flex gap-3">
                    {/* Placeholder stats */}
                </div>
            </div>

            {/* Actions (Mocked to match PostCard visual) */}
            {/* Actions */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                    <button
                        onClick={handleJoin}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Users className="h-5 w-5" />
                        <span className="text-sm font-medium">Join</span>
                    </button>
                    <Link href={eventUrl} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Discussion</span>
                    </Link>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Share</span>
                    </button>
                </div>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Bookmark className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
