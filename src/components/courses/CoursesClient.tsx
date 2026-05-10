'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseCard } from '@/components/courses/CourseCard';
import { LoginModal } from '@/components/auth/LoginModal';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

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

export default function CoursesClient({ initialCourses }: { initialCourses: Course[] }) {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [activeTab, setActiveTab] = useState(searchParams.get('filter') || 'all');
    const [savedCourseIds, setSavedCourseIds] = useState<string[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMyBookmarks();
        }
    }, [session?.user?.id]);

    const fetchMyBookmarks = async () => {
        try {
            const userRes = await fetch(`/api/users/${session?.user?.id}`);
            
            // Robust response check before parsing JSON
            if (!userRes.ok) {
                console.error('Failed to load bookmarks, server responded with status:', userRes.status);
                return;
            }

            const userData = await userRes.json();
            
            if (userData.user?.savedCourses) {
                setSavedCourseIds(userData.user.savedCourses.map((c: any) => typeof c === 'string' ? c : c._id));
            }
        } catch (error) {
            console.error('Failed to load bookmarks', error);
        }
    };

    const handleFilterChange = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (search) params.set('q', search); else params.delete('q');
        if (activeTab !== 'all') params.set('filter', activeTab); else params.delete('filter');
        router.push(`/courses?${params.toString()}`);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeTab]);

    const toggleBookmark = async (courseId: string) => {
        if (!session?.user) { toast.error("Please login to save courses"); return; }
        const isSaved = savedCourseIds.includes(courseId);
        setSavedCourseIds(prev => isSaved ? prev.filter(id => id !== courseId) : [...prev, courseId]);
        try {
            const res = await fetch(`/api/courses/${courseId}/bookmark`, { method: 'POST' });
            if (!res.ok) setSavedCourseIds(prev => isSaved ? [...prev, courseId] : prev.filter(id => id !== courseId));
        } catch (error) {
            setSavedCourseIds(prev => isSaved ? [...prev, courseId] : prev.filter(id => id !== courseId));
        }
    };

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
                        <Input type="search" placeholder="Search courses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Link href="/courses/create">
                        <Button onClick={(e) => { if (!session) { e.preventDefault(); setShowLoginModal(true); } }}><Plus className="mr-2 h-4 w-4" /> Create Course</Button>
                    </Link>
                </div>
            </div>

            <div className="hidden md:block">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-10 py-0">
                        <TabsTrigger value="all">All Courses</TabsTrigger>
                        <TabsTrigger value="enrolled" disabled={!session?.user}>Enrolled</TabsTrigger>
                        <TabsTrigger value="mine" disabled={!session?.user}>My Courses</TabsTrigger>
                        <TabsTrigger value="favorites" disabled={!session?.user}>Favourites</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {initialCourses.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <h3 className="text-xl font-medium text-muted-foreground">No courses found.</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {initialCourses.map((course) => (
                        <CourseCard key={course._id} course={course} currentUserId={session?.user?.id} isBookmarked={savedCourseIds.includes(course._id)} onToggleBookmark={() => toggleBookmark(course._id)} />
                    ))}
                </div>
            )}
            <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} title="Login Required" />
        </div>
    );
}
