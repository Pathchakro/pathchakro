import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Users, Clock, Share2, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Helper to fetch course
async function getCourse(slug: string) {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/courses/slug/${slug}`, {
        cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const course = await getCourse(slug);
    if (!course) return {};

    return {
        title: course.title,
        description: `Enroll in ${course.title} - ${course.mode} course at Pathchakro.`,
        openGraph: {
            images: [course.banner],
            title: course.title,
            description: `Join us for ${course.title}. Registration ends ${new Date(course.lastDateRegistration).toLocaleDateString()}.`
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

    if (!course) notFound();

    return (
        <div className="container py-10 space-y-8">
            {/* Banner */}
            <div className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden shadow-xl">
                <img
                    src={course.banner}
                    alt={course.title}
                    className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white space-y-4">
                    <Badge className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-1.5 capitalize text-base">
                        {course.mode}
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-4xl">
                        {course.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-gray-200">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 border border-white/50">
                                <AvatarImage src={course.instructor?.image} />
                                <AvatarFallback>IN</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{course.instructor?.name || 'Instructor'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{course.students?.length || 0} Students Enrolled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Starts {new Date(course.classStartDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="prose dark:prose-invert max-w-none">
                        <h2 className="text-2xl font-bold mb-4">About this Course</h2>
                        <div className="bg-muted/30 p-6 rounded-lg border">
                            <p className="whitespace-pre-wrap">{
                                typeof course.description === 'string' && course.description.startsWith('{')
                                    ? "View course content details in the app."
                                    : course.description
                            }</p>
                        </div>
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
                                    <span className="font-medium">{new Date(course.lastDateRegistration).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Classes Start</span>
                                    <span className="font-medium">{new Date(course.classStartDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Total Classes</span>
                                    <span className="font-medium">{course.totalClasses}</span>
                                </div>
                            </div>

                            <Button className="w-full text-lg font-semibold h-12 shadow-md hover:shadow-xl transition-all" asChild>
                                <Link href={`/courses/${slug}/enroll`}>Enroll Now</Link>
                            </Button>

                            <div className="pt-4">
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Share2 className="h-4 w-4" /> Share this course
                                </h4>
                                <div className="flex gap-2">
                                    <SocialLink
                                        platform="facebook"
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/courses/${slug}`)}`}
                                    />
                                    <SocialLink
                                        platform="twitter"
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${course.title}!`)}&url=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/courses/${slug}`)}`}
                                    />
                                    <SocialLink
                                        platform="linkedin"
                                        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`${process.env.NEXTAUTH_URL}/courses/${slug}`)}&title=${encodeURIComponent(course.title)}`}
                                    />
                                </div>
                            </div>
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
