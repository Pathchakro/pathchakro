import Link from 'next/link';
import Image from 'next/image';
import { DollarSign, MapPin, Users, MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, Plane } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TourCardProps {
    tour: {
        _id: string;
        slug?: string;
        title: string;
        destination: string;
        description: string;
        startDate: string | Date;
        budget: number;
        status: string;
        organizer: {
            name: string;
            image?: string;
        };
        participants: any[];
    };
}

export function TourCard({ tour }: TourCardProps) {
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

    const linkHref = `/tours/${tour.slug || tour._id}`;

    return (
        <div className="bg-card rounded-lg shadow-sm p-4 mb-4 border">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    {tour.organizer.image ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden relative">
                            <Image
                                src={tour.organizer.image}
                                alt={tour.organizer.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-medium">
                            {tour.organizer.name[0]}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">{tour.organizer.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Tour • {formatDate(tour.startDate)}
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
                            <Link href={linkHref} className="w-full">View Tour</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Body */}
            <div className="mb-4">
                <Link href={linkHref}>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold hover:text-primary transition-colors">
                            {tour.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${getStatusColor(tour.status)}`}>
                            {tour.status.toUpperCase()}
                        </span>
                    </div>

                    {/* Placeholder Image for Tour */}
                    <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center rounded-md mb-3">
                        <Plane className="h-16 w-16 text-white/50" />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {tour.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{tour.destination}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>৳{tour.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{tour.participants.length} Going</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t mt-3">
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Heart className="h-5 w-5" />
                        <span className="text-sm font-medium">Interested</span>
                    </button>
                    <Link href={linkHref} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Discuss</span>
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
