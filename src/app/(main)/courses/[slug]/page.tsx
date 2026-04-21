import { Metadata } from 'next';
// Course details page for Pathchakro
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Calendar, Users, Clock, Share2, Info, CheckCircle2 } from 'lucide-react';
import he from 'he';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { EnrollButton } from '@/components/courses/EnrollButton';
import { CourseDescription } from '@/components/courses/CourseDescription';

import { generateHtml } from '@/lib/server-html';

// Helper to fetch course
async function getCourse(slug: string) {
    if (!process.env.NEXTAUTH_URL) return null;

    try {
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/courses/${slug}`, {
            cache: 'force-cache',
            next: { tags: ['courses', `course-${slug}`] }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

// Helper to format date with fallback
function formatDate(dateString: string | Date | null | undefined) {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString('en-US');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const course = await getCourse(slug);
    if (!course) return {};

    // Generate description from content
    let description = '';
    if (course.description) {
        const htmlContent = generateHtml(course.description);
        // Strip HTML, decode entities, and truncate gracefully
        const plainText = he.decode(htmlContent.replace(/<[^>]*>?/gm, ''));
        if (plainText.length <= 160) {
            description = plainText.trim();
        } else {
            const truncated = plainText.substring(0, 160);
            const lastSpace = truncated.lastIndexOf(' ');
            description = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated).trim() + '...';
        }
    }

    if (!description) {
        description = `Enroll in ${course.title} - ${course.mode} course at Pathchakro.`;
    }

    return {
        title: course.title,
        description: description,
        openGraph: {
            images: [course.banner],
            title: course.title,
            description: description,
        },
        twitter: {
            card: 'summary_large_image',
            images: [course.banner]
        }
    };
}

export default async function CourseDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const course = await getCourse(slug);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    if (!course) notFound();

    return (
        <div className="container py-10 space-y-8">
            {/* Banner */}
            <div className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden shadow-lg">
                <Image
                    src={course.banner}
                    alt={course.title}
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Course Header Info */}
            <div className="space-y-6">
                <Badge className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-1.5 capitalize text-sm md:text-base w-fit">
                    {course.mode}
                </Badge>
                
                <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-5xl text-foreground">
                    {course.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm md:text-base text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                            <AvatarImage src={course.instructor?.image} />
                            <AvatarFallback>IN</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Instructor</span>
                            <span className="font-semibold text-foreground leading-tight">{course.instructor?.name || 'Instructor'}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold">Enrollment</p>
                            <p className="font-semibold text-foreground">{course.students?.length || 0} Students</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold">Start Date</p>
                            <p className="font-semibold text-foreground">{formatDate(course.classStartDate)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="prose dark:prose-invert max-w-none">
                        <h2 className="text-2xl font-bold mb-4">About this Course</h2>
                        <CourseDescription description={course.description} />
                    </div>

                    <Separator />

                    {/* Enrolled Students */}
                    <div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Users className="h-5 w-5" /> Enrolled Students
                        </h3>
                        {course.students && course.students.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {course.students.map((student: any, i: number) => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                                            <AvatarImage src={student.image} />
                                            <AvatarFallback>{student.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground w-16 truncate text-center">
                                            {student.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">Be the first to enroll!</p>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="sticky top-24 border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-primary">৳ {course.fee}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Registration Ends</span>
                                    <span className="font-medium">{formatDate(course.lastDateRegistration)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Classes Start</span>
                                    <span className="font-medium">{formatDate(course.classStartDate)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Total Classes</span>
                                    <span className="font-medium">{course.totalClasses}</span>
                                </div>
                            </div>

                            <EnrollButton slug={slug} />

                            {baseUrl && (
                                <div className="pt-4">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <Share2 className="h-4 w-4" /> Share this course
                                    </h4>
                                    <div className="flex gap-2">
                                        <SocialLink
                                            platform="facebook"
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${baseUrl}/courses/${slug}`)}`}
                                        />
                                        <SocialLink
                                            platform="twitter"
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${course.title}!`)}&url=${encodeURIComponent(`${baseUrl}/courses/${slug}`)}`}
                                        />
                                        <SocialLink
                                            platform="linkedin"
                                            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${baseUrl}/courses/${slug}`)}&title=${encodeURIComponent(course.title)}`}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SocialLink({ platform, href }: { platform: string, href: string }) {
    const colors: Record<string, string> = {
        facebook: 'bg-blue-600 hover:bg-blue-700',
        twitter: 'bg-sky-500 hover:bg-sky-600',
        linkedin: 'bg-blue-700 hover:bg-blue-800'
    };

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${colors[platform] || 'bg-gray-500'} text-white p-2 rounded-md transition-colors flex-1 text-center capitalize text-xs font-semibold`}
        >
            {platform}
        </a>
    );
}
