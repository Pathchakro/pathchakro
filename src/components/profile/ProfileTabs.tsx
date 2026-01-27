'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProfileTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOwnProfile?: boolean;
}

const TABS = [
    { id: 'posts', label: 'Posts' },
    { id: 'events', label: 'Events' },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'tours', label: 'Tours' },
    { id: 'library', label: 'Reading List' },
    { id: 'my-books', label: 'My Books' },
];

export function ProfileTabs({ activeTab, onTabChange, isOwnProfile }: ProfileTabsProps) {
    const tabs = [...TABS];
    if (isOwnProfile) {
        tabs.push({ id: 'bookmarks', label: 'Bookmarks' });
    }

    return (
        <div className="bg-card rounded-lg shadow-sm border mb-4">
            <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            'px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors',
                            activeTab === tab.id
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
