'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, Calendar, ArrowRight, Video, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Course {
    _id: string;
    title: string;
    slug: string;
    banner: string;
    classStartDate: string | Date;
    mode: 'online' | 'offline';
}

export function UpcomingCoursesCard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpcomingCourses = async () => {
            try {
                const response = await fetch('/api/courses?upcoming=true');
                if (!response.ok) throw new Error('Failed to fetch courses');
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setCourses(data.slice(0, 1)); // Show only the most imminent course
                }
            } catch (error) {
                console.error('Error fetching upcoming courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUpcomingCourses();
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

    if (courses.length === 0) return null;

    const course = courses[0];
    const courseUrl = `/courses/${course.slug || course._id}`;

    return (
        <div className="bg-card rounded-lg p-4 mb-4 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm tracking-tight">Upcoming Course</h3>
                </div>
                <Link
                    href={courseUrl}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group/join transition-all"
                >
                    View
                    <ArrowRight className="h-3.5 w-3.5 group-hover/join:translate-x-1 transition-transform" />
                </Link>
            </div>

            <Link href={courseUrl} className="group block">
                <div className="relative h-40 w-full rounded-lg overflow-hidden mb-3 bg-muted">
                    <Image
                        src={course.banner}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white flex items-center gap-1">
                        {course.mode === 'online' ? <Video className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                        {course.mode.toUpperCase()}
                    </div>
                </div>

                <div className="space-y-1">
                    <h4 className="text-sm font-bold group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {course.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>Starts: {formatDate(course.classStartDate)}</span>
                    </div>
                </div>
            </Link>

            <div className="mt-4 pt-3 border-t">
                <Link href="/courses" className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all group/see-all">
                    See All Courses
                    <ArrowRight className="h-3.5 w-3.5 group-hover/see-all:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
