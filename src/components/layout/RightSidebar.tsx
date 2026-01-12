'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export function RightSidebar() {
    return (
        <aside className="hidden xl:block w-80 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
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
                    {[
                        { name: 'Scholar A', rank: 'Master', points: 2500 },
                        { name: 'Reader B', rank: 'Scholar', points: 1800 },
                        { name: 'User C', rank: 'Critic', points: 1200 },
                    ].map((user, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                                {user.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.rank} • {user.points} pts</p>
                            </div>
                            <button className="text-xs text-primary hover:underline">Follow</button>
                        </div>
                    ))}
                </div>
            </div>


        </aside>
    );
}
