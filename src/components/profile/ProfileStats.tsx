'use client';

import { FileText, Star, BookOpen } from 'lucide-react';

interface ProfileStatsProps {
    stats: {
        posts: number;
        reviews: number;
        library: {
            completed: number;
            reading: number;
            wishlist: number;
            total: number;
        };
    };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
    const statItems = [
        { label: 'Posts', value: stats.posts, icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { label: 'Reviews', value: stats.reviews, icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
        { label: 'Library', value: stats.library.total, icon: BookOpen, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    ];

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            {statItems.map((item) => (
                <div key={item.label} className="bg-card rounded-lg border shadow-sm p-4 flex items-center gap-4">
                    <div className={`${item.bgColor} p-3 rounded-full hidden sm:block`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
