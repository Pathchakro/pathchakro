'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Award, Users, ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Assignment {
    _id: string;
    teacher: {
        _id: string;
        name: string;
        image?: string;
    };
    title: string;
    description: string;
    dueDate: string;
    totalPoints: number;
    submissions: Array<{
        _id: string;
        student: {
            _id: string;
            name: string;
            image?: string;
        };
        submittedAt: string;
        content: string;
        grade?: number;
        feedback?: string;
        status: string;
    }>;
    status: string;
    createdAt: string;
}

export default function AssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionContent, setSubmissionContent] = useState('');
    const [activeTab, setActiveTab] = useState('details');

    // Grading state
    const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
    const [gradeValue, setGradeValue] = useState('');
    const [gradeFeedback, setGradeFeedback] = useState('');

    useEffect(() => {
        fetchAssignment();
    }, [assignmentId]);

    const fetchAssignment = async () => {
        try {
            const response = await fetch(`/api/assignments/${assignmentId}`);
            const data = await response.json();

            if (data.assignment) {
                setAssignment(data.assignment);
            }
        } catch (error) {
            console.error('Error fetching assignment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!submissionContent.trim()) {
            alert('Please enter your submission');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: submissionContent,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                setSubmissionContent('');
                fetchAssignment();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error submitting assignment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGrade = async (submissionId: string) => {
        const grade = parseFloat(gradeValue);

        if (isNaN(grade) || grade < 0 || grade > (assignment?.totalPoints || 100)) {
            alert(`Grade must be between 0 and ${assignment?.totalPoints}`);
            return;
        }

        try {
            const response = await fetch(`/api/assignments/${assignmentId}/grade/${submissionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grade,
                    feedback: gradeFeedback,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                setGradingSubmissionId(null);
                setGradeValue('');
                setGradeFeedback('');
                fetchAssignment();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error grading submission:', error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    Loading assignment...
                </div>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Assignment not found</h2>
                    <Link href="/assignments">
                        <Button>Back to Assignments</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isOverdue = new Date() > new Date(assignment.dueDate);
    const mySubmission = assignment.submissions[0]; // Simplified - assumes user's submission
    const hasSubmitted = assignment.submissions.length > 0;

    return (
        <div className="max-w-5xl mx-auto p-4">
            <Link href="/assignments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Assignments
            </Link>

            {/* Assignment Header */}
            <div className="bg-card rounded-lg shadow-sm border p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{assignment.title}</h1>
                        <p className="text-muted-foreground">By {assignment.teacher.name}</p>
                    </div>
                    {hasSubmitted && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Submitted
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Due Date</p>
                            <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                {formatDate(assignment.dueDate)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Points</p>
                            <p className="font-medium">{assignment.totalPoints}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Submissions</p>
                            <p className="font-medium">{assignment.submissions.length}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                                {isOverdue ? 'Overdue' : 'Active'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-lg shadow-sm border mb-4">
                <div className="flex overflow-x-auto">
                    {['details', 'submissions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="space-y-4">
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                        <h2 className="font-semibold text-lg mb-3">Instructions</h2>
                        <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
                    </div>

                    {!hasSubmitted && !isOverdue && (
                        <div className="bg-card rounded-lg shadow-sm border p-6">
                            <h2 className="font-semibold text-lg mb-3">Submit Your Work</h2>
                            <div className="space-y-3">
                                <Textarea
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    placeholder="Enter your submission here..."
                                    rows={8}
                                    disabled={isSubmitting}
                                />
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {hasSubmitted && mySubmission && (
                        <div className="bg-card rounded-lg shadow-sm border p-6">
                            <h2 className="font-semibold text-lg mb-3">Your Submission</h2>
                            <p className="text-sm text-muted-foreground mb-3">
                                Submitted on {formatDate(mySubmission.submittedAt)}
                            </p>
                            <p className="text-muted-foreground whitespace-pre-wrap mb-4">{mySubmission.content}</p>

                            {mySubmission.grade !== undefined && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="font-semibold text-green-800 mb-1">
                                        Grade: {mySubmission.grade}/{assignment.totalPoints}
                                    </p>
                                    {mySubmission.feedback && (
                                        <p className="text-sm text-green-700">{mySubmission.feedback}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'submissions' && (
                <div className="space-y-3">
                    {assignment.submissions.length === 0 ? (
                        <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
                            No submissions yet
                        </div>
                    ) : (
                        assignment.submissions.map((submission) => (
                            <div key={submission._id} className="bg-card rounded-lg shadow-sm border p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold">{submission.student.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Submitted {formatDate(submission.submittedAt)}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${submission.status === 'graded' ? 'bg-green-100 text-green-700' :
                                            submission.status === 'late' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {submission.status.toUpperCase()}
                                    </span>
                                </div>

                                <p className="text-muted-foreground whitespace-pre-wrap mb-4">{submission.content}</p>

                                {submission.grade !== undefined ? (
                                    <div className="bg-muted rounded-lg p-3">
                                        <p className="font-semibold mb-1">
                                            Grade: {submission.grade}/{assignment.totalPoints}
                                        </p>
                                        {submission.feedback && (
                                            <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                                        )}
                                    </div>
                                ) : gradingSubmissionId === submission._id ? (
                                    <div className="space-y-3 border-t pt-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label>Grade (out of {assignment.totalPoints})</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={assignment.totalPoints}
                                                    value={gradeValue}
                                                    onChange={(e) => setGradeValue(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Feedback (Optional)</Label>
                                            <Textarea
                                                value={gradeFeedback}
                                                onChange={(e) => setGradeFeedback(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleGrade(submission._id)} className="flex-1">
                                                Submit Grade
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setGradingSubmissionId(null);
                                                    setGradeValue('');
                                                    setGradeFeedback('');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => setGradingSubmissionId(submission._id)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Grade Submission
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
