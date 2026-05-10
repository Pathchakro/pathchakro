'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select } from '@/components/ui/select';

interface Assignment {
    _id: string;
    title: string;
    description: string;
    dueDate: string;
    teacher: {
        _id: string;
        name: string;
    };
    submissions: Array<{
        student: string;
        submittedAt: string;
    }>;
}

interface AssignmentsClientProps {
    initialAssignments: Assignment[];
    session?: any; // NextAuth session shape
}

type ViewMode = 'student' | 'teacher';

export default function AssignmentsClient({ initialAssignments, session }: AssignmentsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Validate role from URL or default to student
    const getInitialRole = (): ViewMode => {
        const role = searchParams.get('role');
        if (role === 'teacher' || role === 'student') return role;
        return 'student';
    };

    const [viewMode, setViewMode] = useState<ViewMode>(getInitialRole());

    // Sync viewMode to URL without adding to history
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (viewMode === 'teacher') {
            params.set('role', 'teacher');
        } else {
            params.delete('role');
        }
        
        const newUrl = `/assignments${params.toString() ? `?${params.toString()}` : ''}`;
        const currentQuery = window.location.search;
        const expectedQuery = params.toString() ? `?${params.toString()}` : '';

        if (currentQuery !== expectedQuery) {
            router.replace(newUrl);
        }
    }, [viewMode, searchParams, router]);

    const getStatusInfo = (dueDate: string, submissions: any[]) => {
        const userId = session?.user?.id;
        const isSubmitted = submissions?.some(s => 
            (typeof s.student === 'string' ? s.student : s.student?._id) === userId
        );
        const isOverdue = new Date() > new Date(dueDate);

        if (isSubmitted) return { color: 'text-green-600', icon: <CheckCircle className="h-4 w-4" />, text: 'Submitted' };
        if (isOverdue) return { color: 'text-red-600', icon: <AlertCircle className="h-4 w-4" />, text: 'Overdue' };
        return { color: 'text-orange-600', icon: <Clock className="h-4 w-4" />, text: 'Pending' };
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Assignments</h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        {viewMode === 'teacher' ? 'Manage and track your students\' work' : 'View and submit your course assignments'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select 
                        value={viewMode} 
                        onChange={(e) => setViewMode(e.target.value as ViewMode)}
                        className="w-40 h-11 rounded-xl font-bold bg-muted/30 border-0"
                    >
                        <option value="student">Student View</option>
                        <option value="teacher">Teacher View</option>
                    </Select>
                    {viewMode === 'teacher' && (
                        <Link href="/assignments/create">
                            <Button className="rounded-xl h-11 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2">
                                <Plus className="h-4 w-4" /> Create
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {initialAssignments.length === 0 ? (
                <div className="text-center py-24 bg-card border-2 border-dashed rounded-[3rem]">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">No assignments found</h3>
                    <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                        Check back later or switch views to see assignments.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {initialAssignments.map((assignment) => {
                        const status = getStatusInfo(assignment.dueDate, assignment.submissions);
                        return (
                            <Link 
                                key={assignment._id} 
                                href={`/assignments/${assignment._id}`} 
                                className="group relative bg-card border-2 rounded-3xl p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black group-hover:text-primary transition-colors">{assignment.title}</h3>
                                        <p className="text-muted-foreground font-medium line-clamp-1">{assignment.description}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs font-bold ${status.color}`}>
                                            {status.icon}
                                            {status.text}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
