'use client';

import { UpcomingEventsCard } from '@/components/events/UpcomingEventsCard';
import { UpcomingTourCard } from '@/components/tours/UpcomingTourCard';
import { UpcomingCoursesCard } from '@/components/courses/UpcomingCoursesCard';

export function RightSidebar() {
    return (
        <aside className="hidden xl:block w-80 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 custom-scrollbar">
            {/* Upcoming Events */}
            <UpcomingEventsCard />

            {/* Upcoming Tours */}
            <UpcomingTourCard />

            {/* Upcoming Courses */}
            <UpcomingCoursesCard />
        </aside>
    );
}
