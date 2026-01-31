'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus, Users, Calendar, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { CourseCard } from '@/components/courses/CourseCard';

// Simplified Course interface (matching what API returns populated)
interface Course {
    _id: string;
    title: string;
    banner: string;
    fee: number;
    mode: 'online' | 'offline';
    lastDateRegistration: string;
    students: any[];
    slug?: string;
    instructor?: any;
}

export default function CoursesPage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [savedCourseIds, setSavedCourseIds] = useState<string[]>([]);

    useEffect(() => {
        fetchCourses();
    }, [activeTab]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMyBookmarks();
        }
    }, [session?.user?.id]);

    const fetchMyBookmarks = async () => {
        try {
            // Lazy fetch user data to get bookmarks
            // Assuming api/users/me works or similar, using generic one
            const userRes = await fetch(`/api/users/${session?.user?.id}`);
            const userData = await userRes.json();
            if (userData.user?.savedCourses) {
                setSavedCourseIds(userData.user.savedCourses.map((c: any) => typeof c === 'string' ? c : c._id));
            }
        } catch (error) {
            console.error('Failed to load bookmarks', error);
        }
    };

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab === 'mine') params.append('filter', 'mine');
            if (activeTab === 'favorites') params.append('filter', 'favorites');
            if (activeTab === 'enrolled') params.append('filter', 'enrolled');

            const res = await fetch(`/api/courses?${params}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setCourses(data);
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error('Failed to load courses', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBookmark = async (courseId: string) => {
        if (!session?.user) {
            alert("Please login to save courses");
            return;
        }

        const isSaved = savedCourseIds.includes(courseId);
        const newSavedIds = isSaved
            ? savedCourseIds.filter(id => id !== courseId)
            : [...savedCourseIds, courseId];

        setSavedCourseIds(newSavedIds);

        try {
            const res = await fetch(`/api/courses/${courseId}/bookmark`, { method: 'POST' });
            if (!res.ok) {
                // Revert
                setSavedCourseIds(isSaved ? [...savedCourseIds] : savedCourseIds.filter(id => id !== courseId));
            }
        } catch (error) {
            console.error(error);
            setSavedCourseIds(isSaved ? [...savedCourseIds] : savedCourseIds.filter(id => id !== courseId));
        }
    };

    const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Browse Courses</h1>
                    <p className="text-muted-foreground mt-1">Explore our latest courses and workshops.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search courses..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {session && (
                        <Button asChild>
                            <Link href="/courses/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Course
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Courses</TabsTrigger>
                    <TabsTrigger value="enrolled" disabled={!session?.user}>Enrolled</TabsTrigger>
                    <TabsTrigger value="mine" disabled={!session?.user}>My Courses</TabsTrigger>
                    <TabsTrigger value="favorites" disabled={!session?.user}>Favourites</TabsTrigger>
                </TabsList>
            </Tabs>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <h3 className="text-xl font-medium text-muted-foreground">No courses found.</h3>
                    {activeTab !== 'all' && <p className="text-muted-foreground mt-2">Try switching tabs or creating a course!</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredCourses.map((course) => (
                        <CourseCard
                            key={course._id}
                            course={course}
                            currentUserId={session?.user?.id}
                            isBookmarked={savedCourseIds.includes(course._id)}
                            onToggleBookmark={() => toggleBookmark(course._id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
