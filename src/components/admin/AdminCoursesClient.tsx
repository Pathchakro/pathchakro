'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Eye, Calendar, Users, GraduationCap, DollarSign, BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

interface Student {
    _id: string;
    name: string;
    email: string;
    image?: string;
}

interface Course {
    _id: string;
    title: string;
    slug: string;
    banner: string;
    fee: number;
    mode: 'online' | 'offline';
    totalClasses: number;
    classStartDate: string;
    lastDateRegistration: string;
    instructor: {
        _id: string;
        name: string;
        image?: string;
    };
    students: Student[];
}

interface AdminCoursesClientProps {
    initialCourses: Course[];
}

export default function AdminCoursesClient({ initialCourses }: AdminCoursesClientProps) {
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

    const handleRemoveStudent = async (courseId: string, studentId: string) => {
        if (!confirm('Are you sure you want to remove this student from the course? This will also affect their enrollment record.')) {
            return;
        }

        setRemovingStudentId(studentId);
        try {
            const response = await fetch(`/api/courses/${courseId}/students`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Student removed successfully');
                
                // Update local state
                const updatedCourses = courses.map(c => {
                    if (c._id === courseId) {
                        const updatedStudents = c.students.filter(s => s._id !== studentId);
                        const updatedCourseObj = { ...c, students: updatedStudents };
                        if (selectedCourse && selectedCourse._id === c._id) {
                            setSelectedCourse(updatedCourseObj);
                        }
                        return updatedCourseObj;
                    }
                    return c;
                });
                setCourses(updatedCourses);
            } else {
                toast.error(data.error || 'Failed to remove student');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setRemovingStudentId(null);
        }
    };

    return (
        <div className="container py-8 max-w-7xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Manage Courses</h1>
                <p className="text-muted-foreground">Monitor courses, instructors, and enrolled students.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Courses</CardTitle>
                    <CardDescription>Overview of active, public, and private courses.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Details</TableHead>
                                <TableHead>Instructor</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead>Mode & Classes</TableHead>
                                <TableHead>Enrolled Students</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No courses found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                courses.map((course) => (
                                    <TableRow key={course._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                                                    <Image src={course.banner} alt={course.title} fill className="object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm line-clamp-1">{course.title}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">{course.mode}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-xs font-bold">
                                                    {course.instructor.image ? (
                                                        <Image src={course.instructor.image} alt={course.instructor.name} width={32} height={32} />
                                                    ) : (
                                                        course.instructor.name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium">{course.instructor.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <span>{formatDate(course.classStartDate)}</span>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {course.fee === 0 ? 'Free' : `৳${course.fee.toLocaleString()}`}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <div className="flex flex-col">
                                                <span className="capitalize font-semibold">{course.mode}</span>
                                                <span className="text-muted-foreground">{course.totalClasses} classes</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-bold text-sm">{course.students.length}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/courses/${course.slug}`} target="_blank">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" title="View Course Page">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="outline" onClick={() => setSelectedCourse(course)}>
                                                            Manage Students
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Enrolled Students</DialogTitle>
                                                            <DialogDescription>
                                                                Manage student roster for &quot;{course.title}&quot;
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="space-y-4 my-4">
                                                            <div className="flex items-center gap-6 p-3 bg-muted/30 rounded-lg text-sm">
                                                                <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4 text-muted-foreground" /> {course.totalClasses} classes</span>
                                                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-muted-foreground" /> Starts {formatDate(course.classStartDate)}</span>
                                                                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-muted-foreground" /> {course.fee === 0 ? 'Free' : `৳${course.fee}`}</span>
                                                            </div>

                                                            <h4 className="font-semibold text-sm">Roster ({course.students.length} students)</h4>
                                                            <div className="border rounded-lg overflow-hidden">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="bg-muted/50">
                                                                            <TableHead>Student</TableHead>
                                                                            <TableHead>Email</TableHead>
                                                                            <TableHead className="text-right">Action</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {course.students.length === 0 ? (
                                                                            <TableRow>
                                                                                <TableCell colSpan={3} className="text-center text-muted-foreground text-xs py-6">
                                                                                    No students enrolled in this course yet.
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ) : (
                                                                            course.students.map((student) => (
                                                                                <TableRow key={student._id}>
                                                                                    <TableCell className="font-medium text-sm flex items-center gap-2">
                                                                                        <div className="h-6 w-6 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                                                            {student.image ? (
                                                                                                <Image src={student.image} alt={student.name} width={24} height={24} />
                                                                                            ) : (
                                                                                                student.name?.charAt(0) || '?'
                                                                                            )}
                                                                                        </div>
                                                                                        {student.name}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-xs text-muted-foreground">
                                                                                        {student.email}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-right">
                                                                                        <Button
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                                            disabled={removingStudentId === student._id}
                                                                                            onClick={() => handleRemoveStudent(course._id, student._id)}
                                                                                        >
                                                                                            {removingStudentId === student._id ? (
                                                                                                <Loader2 className="animate-spin h-4 w-4" />
                                                                                            ) : (
                                                                                                <Trash2 className="h-4 w-4" />
                                                                                            )}
                                                                                        </Button>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))
                                                                        )}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
