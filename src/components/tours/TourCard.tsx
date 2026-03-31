import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DollarSign, MapPin, Users, MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, Plane } from 'lucide-react';
import { formatDate, extractPlainText } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageSlider } from './ImageSlider';
import { ShareDialog } from '@/components/feed/ShareDialog';

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
        images?: string[];
        bannerUrl?: string;
    };
}

export function TourCard({ tour }: TourCardProps) {
    const { data: session } = useSession();
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

    // Simplified using ImageSlider component

    const handleActionClick = (e: React.MouseEvent, action: string) => {
        if (!session) {
            e.preventDefault();
            e.stopPropagation();
            toast.error("Please login to continue");
            return;
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

                    {/* Tour Image Slider */}
                    <ImageSlider 
                        images={tour.images && tour.images.length > 0 ? tour.images : (tour.bannerUrl ? [tour.bannerUrl] : [])} 
                        title={tour.title}
                        aspectRatio="aspect-video shadow-inner rounded-md"
                    />

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
                        {extractPlainText(tour.description)}
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
                    <button
                        aria-label="Interested"
                        onClick={(e) => handleActionClick(e, 'interested')}
                        className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Heart className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="text-sm font-medium hidden md:inline">Interested</span>
                    </button>
                    <Link
                        href={linkHref}
                        aria-label="Discuss"
                        onClick={(e) => handleActionClick(e, 'discuss')}
                        className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="text-sm font-medium hidden md:inline">Discuss</span>
                    </Link>
                    <ShareDialog
                        post={{
                            _id: tour._id,
                            title: tour.title,
                            slug: tour.slug,
                            description: tour.description
                        }}
                        basePath="/tours"
                        trigger={
                            <button
                                aria-label="Share"
                                className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="text-sm font-medium hidden md:inline">Share</span>
                            </button>
                        }
                    />
                </div>
                <button
                    aria-label="Bookmark"
                    onClick={(e) => handleActionClick(e, 'bookmark')}
                    className="p-1.5 md:p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <Bookmark className="h-4 w-4 md:h-5 md:w-5" />
                </button>
            </div>
        </div>
    );
}
