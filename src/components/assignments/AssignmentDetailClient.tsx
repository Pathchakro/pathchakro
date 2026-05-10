'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, Loader2, ArrowLeft, Award, Calendar, Users, GraduationCap } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface AssignmentSubmission {
    _id: string;
    student: { _id: string; name: string; image?: string };
    content: string;
    status: string;
    submittedAt: string | Date;
    grade?: number;
    feedback?: string;
}

interface AssignmentDetailProps {
    initialAssignment: {
        _id: string;
        title: string;
        description: string;
        teacher: { name: string };
        dueDate: string | Date;
        totalPoints: number;
        submissions?: AssignmentSubmission[];
    };
    session: any;
}

export default function AssignmentDetailClient({ initialAssignment, session }: AssignmentDetailProps) {
    const router = useRouter();
    const [assignment] = useState(initialAssignment);
    const [activeTab, setActiveTab] = useState('details');
    const [submissionContent, setSubmissionContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Grading state
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async () => {
        if (!submissionContent.trim()) return toast.error("Empty content");
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/assignments/${assignment._id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: submissionContent.trim() })
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Submitted successfully!");
                setSubmissionContent('');
                router.refresh();
            } else {
                toast.error(data.error || data.message || "Failed to submit assignment");
            }
        } catch (error: any) { 
            console.error('[ASSIGNMENT_SUBMIT_ERROR]:', error);
            toast.error(error?.message || "An unexpected error occurred during submission"); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleGrade = async (subId: string) => {
        const parsedGrade = parseFloat(grade);
        if (isNaN(parsedGrade)) return toast.error("Please enter a valid number for the grade");
        if (parsedGrade < 0 || parsedGrade > assignment.totalPoints) {
            return toast.error(`Grade must be between 0 and ${assignment.totalPoints}`);
        }

        try {
            const res = await fetch(`/api/assignments/${assignment._id}/grade/${subId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grade: parsedGrade, feedback: feedback.trim() })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Graded successfully!");
                setGradingId(null);
                setGrade('');
                setFeedback('');
                router.refresh();
            } else {
                toast.error(data.error || data.message || "Failed to submit grade");
            }
        } catch (error: any) { 
            console.error('[ASSIGNMENT_GRADE_ERROR]:', error);
            toast.error(error?.message || "An error occurred while grading"); 
        }
    };

    const mySub = assignment.submissions?.find((s: AssignmentSubmission) => s.student?._id === session?.user?.id);
    const isOverdue = new Date() > new Date(assignment.dueDate);

    return (
        <div className="max-w-5xl mx-auto p-4 pb-20">
            <Link href="/assignments" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors group">
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ArrowLeft className="h-4 w-4" />
                </div>
                Back to Assignments
            </Link>

            <div className="bg-card border-2 shadow-sm p-8 rounded-3xl mb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-black mb-2 leading-tight">{assignment.title}</h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            By {assignment.teacher?.name}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-muted/50 rounded-2xl border-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-xs font-black uppercase tracking-tight">{formatDate(assignment.dueDate)}</span>
                        </div>
                        <div className="px-4 py-2 bg-primary/5 rounded-2xl border-2 border-primary/10 flex items-center gap-2">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-xs font-black uppercase tracking-tight">{assignment.totalPoints} Points</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex border-b-2 mb-8 bg-muted/20 p-1 rounded-2xl max-w-fit">
                {['details', 'submissions'].map(t => (
                    <button 
                        key={t} 
                        onClick={() => setActiveTab(t)} 
                        className={`px-8 py-2.5 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === t ? 'bg-background text-primary shadow-sm border-2' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {activeTab === 'details' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-card border-2 p-8 rounded-3xl shadow-sm">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Instructions</h2>
                        <p className="whitespace-pre-wrap text-foreground leading-relaxed">{assignment.description}</p>
                    </div>

                    {!mySub && !isOverdue && (
                        <div className="bg-card border-2 p-8 rounded-3xl shadow-lg transform transition-all hover:shadow-xl">
                            <h2 className="text-xl font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                Submit Your Work
                            </h2>
                            <Textarea 
                                value={submissionContent} 
                                onChange={(e) => setSubmissionContent(e.target.value)} 
                                rows={8} 
                                placeholder="Write your submission content here..."
                                className="mb-6 rounded-2xl border-2 focus-visible:ring-primary text-base leading-relaxed p-4" 
                            />
                            <Button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting} 
                                size="lg"
                                className="w-full h-14 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                                {isSubmitting ? 'Sending Submission...' : 'Submit Assignment'}
                            </Button>
                        </div>
                    )}

                    {mySub && (
                        <div className="bg-card border-2 p-8 rounded-3xl shadow-sm bg-gradient-to-br from-background to-primary/5">
                            <h2 className="text-xl font-black mb-6 uppercase tracking-tight text-primary">Your Submission</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Submitted: {formatDate(mySub.submittedAt)}
                            </p>
                            <div className="p-6 bg-background rounded-2xl border-2 mb-6 shadow-inner">
                                <p className="text-foreground leading-relaxed">{mySub.content}</p>
                            </div>
                            {mySub.grade !== undefined && (
                                <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl animate-in zoom-in duration-500">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-emerald-800 font-black text-xl uppercase tracking-tighter">Grade: {mySub.grade} / {assignment.totalPoints}</p>
                                        <Badge>Graded</Badge>
                                    </div>
                                    <p className="text-sm text-emerald-700 font-medium italic">"{mySub.feedback}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'submissions' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {assignment.submissions?.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                            <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No submissions yet</h3>
                        </div>
                    ) : (
                        assignment.submissions?.map((s: AssignmentSubmission) => (
                            <div key={s._id} className="bg-card border-2 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                            {s.student?.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-black text-base">{s.student?.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{formatDate(s.submittedAt)}</p>
                                        </div>
                                    </div>
                                    <Badge>{s.status}</Badge>
                                </div>
                                <div className="p-6 bg-muted/30 rounded-2xl mb-6 shadow-inner">
                                    <p className="text-foreground leading-relaxed">{s.content}</p>
                                </div>
                                {s.grade !== undefined ? (
                                    <div className="p-4 bg-primary/5 border-2 border-primary/10 rounded-2xl flex items-center justify-between">
                                        <p className="font-black text-primary uppercase tracking-tight">Grade: <span className="text-xl">{s.grade}</span> / {assignment.totalPoints}</p>
                                        {s.feedback && <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">"{s.feedback}"</p>}
                                    </div>
                                ) : gradingId === s._id ? (
                                    <div className="space-y-4 p-6 bg-primary/5 border-2 border-primary/20 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <Label className="font-bold ml-1">Grade (Max {assignment.totalPoints})</Label>
                                            <Input 
                                                type="number" 
                                                placeholder="0.0" 
                                                value={grade} 
                                                onChange={(e) => setGrade(e.target.value)} 
                                                className="h-12 rounded-xl border-2 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold ml-1">Feedback</Label>
                                            <Textarea 
                                                placeholder="Provide some feedback to the student..." 
                                                value={feedback} 
                                                onChange={(e) => setFeedback(e.target.value)} 
                                                className="rounded-xl border-2 resize-none"
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <Button onClick={() => handleGrade(s._id)} className="flex-1 h-12 rounded-xl font-bold">Submit Grade</Button>
                                            <Button variant="outline" onClick={() => setGradingId(null)} className="h-12 rounded-xl font-bold">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button onClick={() => setGradingId(s._id)} variant="outline" className="w-full h-12 rounded-xl font-bold border-2 hover:bg-primary hover:text-white transition-all">
                                        <Award className="mr-2 h-4 w-4" /> Grade Submission
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

function Badge({ children }: { children: React.ReactNode }) { 
    return <span className="text-[10px] font-black px-3 py-1 bg-muted border rounded-full uppercase tracking-widest">{children}</span>; 
}
