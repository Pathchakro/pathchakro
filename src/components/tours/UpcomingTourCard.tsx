'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ImageSlider } from './ImageSlider';

interface Tour {
    _id: string;
    title: string;
    slug: string;
    destination: string;
    startDate: string | Date;
    images?: string[];
    bannerUrl?: string;
}

export function UpcomingTourCard() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpcomingTours = async () => {
            try {
                const response = await fetch('/api/tours?upcoming=true');
                if (!response.ok) throw new Error('Failed to fetch tours');
                const data = await response.json();
                if (data.tours && data.tours.length > 0) {
                    setTours(data.tours.slice(0, 1)); // Show only the most imminent tour
                }
            } catch (error) {
                console.error('Error fetching upcoming tours:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUpcomingTours();
    }, []);

    if (loading) {
        return (
            <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border animate-pulse">
                <div className="h-5 w-32 bg-muted rounded mb-4"></div>
                <div className="h-40 bg-muted rounded mb-3"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (tours.length === 0) return null;

    const tour = tours[0];
    const tourUrl = `/tours/${tour.slug || tour._id}`;

    return (
        <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm tracking-tight">Upcoming Tour</h3>
                </div>
                <Link
                    href={tourUrl}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group/join transition-all"
                >
                    View
                    <ArrowRight className="h-3.5 w-3.5 group-hover/join:translate-x-1 transition-transform" />
                </Link>
            </div>

            <Link href={tourUrl} className="group block">
                <ImageSlider 
                    images={tour.images && tour.images.length > 0 ? tour.images : (tour.bannerUrl ? [tour.bannerUrl] : [])} 
                    title={tour.title}
                    aspectRatio="h-40 rounded-lg"
                />

                <div className="space-y-1">
                    <h4 className="text-sm font-bold group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {tour.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span className="truncate">{tour.destination}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>{formatDate(tour.startDate)}</span>
                    </div>
                </div>
            </Link>

            <div className="mt-4 pt-3 border-t">
                <Link href="/tours" className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all group/see-all">
                    See All Tours
                    <ArrowRight className="h-3.5 w-3.5 group-hover/see-all:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
