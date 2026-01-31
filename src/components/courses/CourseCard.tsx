import Link from 'next/link';
import { Calendar, Users, MoreHorizontal, Heart, MessageCircle, Share2, Bookmark, GraduationCap, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseCardProps {
    course: {
        _id: string;
        title: string;
        banner: string;
        fee: number;
        mode: 'online' | 'offline';
        lastDateRegistration: string | Date;
        students: any[];
        slug?: string;
        instructor?: {
            _id: string;
            name: string;
            image?: string;
        } | string;
    };
    currentUserId?: string;
    isBookmarked?: boolean;
    onToggleBookmark?: () => void;
}

export function CourseCard({ course, currentUserId, isBookmarked = false, onToggleBookmark }: CourseCardProps) {
    const instructorName = typeof course.instructor === 'object' && course.instructor?.name ? course.instructor.name : "Instructor";
    const instructorImage = typeof course.instructor === 'object' && course.instructor?.image ? course.instructor.image : null;
    const instructorId = typeof course.instructor === 'object' ? course.instructor?._id : course.instructor;

    // Check if current user is the instructor
    const isInstructor = currentUserId && instructorId && currentUserId === instructorId.toString();

    const linkHref = `/courses/${course.slug || course._id}`;

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const slugOrId = course.slug || course._id;
            const response = await fetch(`/api/courses/slug/${slugOrId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Course deleted successfully');
                window.location.reload();
            } else {
                toast.error('Failed to delete course');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            toast.error('Error deleting course');
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-sm p-4 mb-4 border flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    {instructorImage ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img
                                src={instructorImage}
                                alt={instructorName}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">{instructorName}</p>
                        <p className="text-sm text-muted-foreground">
                            Course • {course.mode}
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Link href={linkHref} className="w-full">View Course</Link>
                        </DropdownMenuItem>
                        {isInstructor && (
                            <>
                                <DropdownMenuItem>
                                    <Link href={`${linkHref}/edit`} className="w-full flex items-center">
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Body */}
            <div className="mb-4 flex-1">
                <Link href={linkHref}>
                    <h3 className="text-xl font-bold hover:text-primary transition-colors mb-3 line-clamp-2">
                        {course.title}
                    </h3>

                    {/* Banner Image */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-md mb-3 border">
                        <img
                            src={course.banner}
                            alt={course.title}
                            className="object-cover w-full h-full"
                        />
                        <Badge className="absolute top-2 right-2 shadow-sm" variant="secondary">
                            ৳ {course.fee}
                        </Badge>
                    </div>

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
                </Link>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t mt-auto">
                <div className="flex gap-2">
                    <button
                        onClick={onToggleBookmark}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-sm font-medium">{isBookmarked ? 'Saved' : 'Save'}</span>
                    </button>
                    <Link href={linkHref} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Details</span>
                    </Link>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Share</span>
                    </button>
                </div>
                <Button asChild size="sm">
                    <Link href={linkHref}>Enroll</Link>
                </Button>
            </div>
        </div>
    );
}
