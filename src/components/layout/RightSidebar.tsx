'use client';

import Link from 'next/link';
import { TrendingUp, Calendar } from 'lucide-react';
import { UpcomingEventsCard } from '@/components/events/UpcomingEventsCard';
import { UpcomingTourCard } from '@/components/tours/UpcomingTourCard';
import { UpcomingCoursesCard } from '@/components/courses/UpcomingCoursesCard';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export function RightSidebar() {
    const [topReaders, setTopReaders] = useState<any[]>([]);

    useEffect(() => {
        const fetchTopReaders = async () => {
            try {
                const res = await fetch('/api/reading-status/completed');
                
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Failed to fetch top readers: ${res.status} ${errorText}`);
                }

                const data = await res.json();
                if (data.leaderboard) {
                    setTopReaders(data.leaderboard.slice(0, 3));
                }
            } catch (error) {
                console.error('Error in fetchTopReaders:', error);
            }
        };
        fetchTopReaders();
    }, []);

    return (
        <aside className="hidden xl:block w-80 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 custom-scrollbar">
            {/* Upcoming Events */}
            <UpcomingEventsCard />

            {/* Upcoming Tours */}
            <UpcomingTourCard />

            {/* Upcoming Courses */}
            <UpcomingCoursesCard />

            {/* Trending Reviews */}
            <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Trending Reviews</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-16 w-12 bg-muted rounded flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Book Title {i}</p>
                                <p className="text-xs text-muted-foreground truncate">by Author Name</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-yellow-500">★★★★★</span>
                                    <span className="text-xs text-muted-foreground">(10)</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Link href="/reviews" className="text-sm text-primary hover:underline mt-3 block">
                    View all reviews →
                </Link>
            </div>

            {/* Top Ranked Users */}
            <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm">Top Readers</h3>
                </div>
                <div className="space-y-3">
                    {topReaders.length > 0 ? topReaders.map((reader, i) => {
                        const userName = reader?.user?.name || 'User';
                        const userImage = reader?.user?.image;

                        return (
                            <div key={i} className="flex items-center gap-3">
                                {userImage ? (
                                    <div className="relative h-10 w-10 flex-shrink-0">
                                        <Image 
                                            src={userImage} 
                                            alt={userName} 
                                            fill
                                            className="rounded-full object-cover" 
                                        />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                                        {userName.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{userName}</p>
                                    <p className="text-xs text-muted-foreground">{reader.count} {reader.count === 1 ? 'Book' : 'Books'} Read</p>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No top readers yet this month.</p>
                    )}
                </div>
                <Link href="/reading-status/completed" className="text-xs text-primary hover:underline mt-3 block text-center border-t pt-3">
                    View Full Leaderboard
                </Link>
            </div>


        </aside>
    );
}
