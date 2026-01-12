'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FileText, Plus, Calendar, Award, Users, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Assignment {
    _id: string;
    teacher: {
        _id: string;
        name: string;
        image?: string;
    };
    team?: {
        _id: string;
        name: string;
    };
    title: string;
    description: string;
    dueDate: string;
    totalPoints: number;
    status: string;
    submissions: any[];
    createdAt: string;
}

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'student' | 'teacher'>('student');

    useEffect(() => {
        fetchAssignments();
    }, [viewMode]);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const params = viewMode === 'teacher' ? '?role=teacher' : '';
            const response = await fetch(`/api/assignments${params}`);
            const data = await response.json();

            if (data.assignments) {
                setAssignments(data.assignments);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (dueDate: string, submissions: any[]) => {
        const isOverdue = new Date() > new Date(dueDate);
        const isSubmitted = submissions.length > 0;

        if (isSubmitted) return 'text-green-600';
        if (isOverdue) return 'text-red-600';
        return 'text-orange-600';
    };

    const getStatusText = (dueDate: string, submissions: any[]) => {
        const isOverdue = new Date() > new Date(dueDate);
        const isSubmitted = submissions.length > 0;

        if (isSubmitted) return 'Submitted';
        if (isOverdue) return 'Overdue';
        return 'Pending';
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Assignments</h1>
                        <p className="text-muted-foreground">
                            {viewMode === 'teacher' ? 'Manage your assignments' : 'View and submit assignments'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'student' | 'teacher')}
                        >
                            <option value="student">Student View</option>
                            <option value="teacher">Teacher View</option>
                        </Select>
                        {viewMode === 'teacher' && (
                            <Link href="/assignments/create">
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Assignment
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading assignments...
                </div>
            ) : assignments.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No assignments</h3>
                    <p className="text-muted-foreground mb-4">
                        {viewMode === 'teacher'
                            ? 'Create your first assignment'
                            : 'No assignments available yet'}
                    </p>
                    {viewMode === 'teacher' && (
                        <Link href="/assignments/create">
                            <Button>Create Assignment</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => {
                        const submittedCount = assignment.submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
                        const gradedCount = assignment.submissions.filter(s => s.status === 'graded').length;
                        const daysUntilDue = Math.ceil(
                            (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                            <Link
                                key={assignment._id}
                                href={`/assignments/${assignment._id}`}
                                className="block bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">{assignment.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {assignment.description}
                                        </p>
                                    </div>
                                    {viewMode === 'student' && (
                                        <span className={`text-sm font-medium ${getStatusColor(assignment.dueDate, assignment.submissions)}`}>
                                            {getStatusText(assignment.dueDate, assignment.submissions)}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Due Date</p>
                                            <p className="font-medium">{formatDate(assignment.dueDate)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Time Left</p>
                                            <p className={`font-medium ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue < 3 ? 'text-orange-600' : ''}`}>
                                                {daysUntilDue < 0 ? 'Overdue' : `${daysUntilDue} days`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Points</p>
                                            <p className="font-medium">{assignment.totalPoints}</p>
                                        </div>
                                    </div>

                                    {viewMode === 'teacher' && (
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Submissions</p>
                                                <p className="font-medium">{submittedCount} ({gradedCount} graded)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                                    <span>By {assignment.teacher.name}</span>
                                    {assignment.team && <span>Team: {assignment.team.name}</span>}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
