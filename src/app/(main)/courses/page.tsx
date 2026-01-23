'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus, Users, Calendar, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Course {
    _id: string;
    title: string;
    banner: string;
    fee: number;
    mode: 'online' | 'offline';
    lastDateRegistration: string;
    students: any[];
}

export default function CoursesPage() {
    const { data: session } = useSession();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch('/api/courses');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCourses(data);
                }
            } catch (error) {
                console.error('Failed to load courses', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="container py-8 space-y-8">
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

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <h3 className="text-xl font-medium text-muted-foreground">No courses found matching your criteria.</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <Card key={course._id} className="overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300">
                            <div className="relative aspect-video w-full overflow-hidden">
                                <img
                                    src={course.banner}
                                    alt={course.title}
                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                                />
                                <Badge className="absolute top-3 right-3 capitalize shadow-sm" variant="secondary">
                                    {course.mode}
                                </Badge>
                            </div>
                            <CardHeader>
                                <CardTitle className="line-clamp-2 leading-tight min-h-[3rem] hover:text-primary transition-colors">
                                    <Link href={`/courses/${course._id}`}>{course.title}</Link>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>{course.students?.length || 0} Enrolled</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>Deadline: {new Date(course.lastDateRegistration).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                    ৳ {course.fee}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" size="lg">
                                    <Link href={`/courses/${course._id}`}>Details & Enroll</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
