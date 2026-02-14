'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trophy, Calendar, Users, ThumbsUp, ArrowLeft, Award, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Contest {
    _id: string;
    title: string;
    description: string;
    category: string;
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    status: string;
    prize: {
        first: string;
        second: string;
        third: string;
    };
    submissions: Array<{
        _id: string;
        user: {
            _id: string;
            name: string;
            image?: string;
        };
        title: string;
        content: string;
        wordCount: number;
        submittedAt: string;
        votes: number;
    }>;
    winners: {
        first?: { user: { name: string } };
        second?: { user: { name: string } };
        third?: { user: { name: string } };
    };
}

export default function ContestDetailPage() {
    const params = useParams();
    const contestId = params.slug as string;

    const [contest, setContest] = useState<Contest | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSubmitForm, setShowSubmitForm] = useState(false);
    const [submissionTitle, setSubmissionTitle] = useState('');
    const [submissionContent, setSubmissionContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
    const [voteError, setVoteError] = useState<string | null>(null);

    useEffect(() => {
        fetchContest();
    }, [contestId]);

    const fetchContest = async () => {
        try {
            const response = await fetch(`/api/contests/${contestId}`);
            const data = await response.json();

            if (data.contest) {
                setContest(data.contest);
            }
        } catch (error) {
            console.error('Error fetching contest:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setSubmissionError(null);
        if (!submissionTitle.trim() || !submissionContent.trim()) {
            setSubmissionError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/contests/${contestId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: submissionTitle,
                    content: submissionContent,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                setSubmissionTitle('');
                setSubmissionContent('');
                setShowSubmitForm(false);
                fetchContest();
            } else {
                setSubmissionError(data.error || 'Failed to submit entry');
            }
        } catch (error) {
            console.error('Error submitting:', error);
            setSubmissionError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (submissionId: string) => {
        setVoteError(null);
        try {
            const response = await fetch(`/api/contests/${contestId}/vote/${submissionId}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                fetchContest();
            } else {
                setVoteError(data.error || 'Failed to vote');
                // Auto-clear vote error after 3 seconds
                setTimeout(() => setVoteError(null), 3000);
            }
        } catch (error) {
            console.error('Error voting:', error);
            setVoteError('Failed to record vote. Please check your connection.');
            setTimeout(() => setVoteError(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    Loading contest...
                </div>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Contest not found</h2>
                    <Link href="/contests">
                        <Button>Back to Contests</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const wordCount = submissionContent.trim().split(/\s+/).filter(Boolean).length;
    const sortedSubmissions = [...contest.submissions].sort((a, b) => b.votes - a.votes);

    return (
        <div className="max-w-5xl mx-auto p-4">
            <Link href="/contests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Contests
            </Link>

            {/* Contest Header */}
            <div className="bg-card rounded-lg shadow-sm border p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${contest.category === 'literature' ? 'bg-pink-100 text-pink-700' :
                                contest.category === 'history' ? 'bg-amber-100 text-amber-700' :
                                    contest.category === 'language' ? 'bg-cyan-100 text-cyan-700' :
                                        contest.category === 'health' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-indigo-100 text-indigo-700'
                                }`}>
                                {contest.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${contest.status === 'active' ? 'bg-green-100 text-green-700' :
                                contest.status === 'voting' ? 'bg-purple-100 text-purple-700' :
                                    contest.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {contest.status.toUpperCase()}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
                        <p className="text-muted-foreground">{contest.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Deadline</p>
                            <p className="font-medium">{formatDate(contest.endDate)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Submissions</p>
                            <p className="font-medium">{contest.submissions.length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">1st Prize</p>
                            <p className="font-medium text-yellow-700">{contest.prize.first}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Other Prizes</p>
                        <p className="text-xs">2nd: {contest.prize.second}</p>
                        <p className="text-xs">3rd: {contest.prize.third}</p>
                    </div>
                </div>

                {contest.status === 'active' && !showSubmitForm && (
                    <Button onClick={() => setShowSubmitForm(true)} className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Submit Your Writing
                    </Button>
                )}
            </div>

            {/* Submit Form */}
            {showSubmitForm && contest.status === 'active' && (
                <div className="bg-card rounded-lg shadow-sm border p-6 mb-4">
                    <h2 className="font-semibold text-lg mb-4">Submit Your Writing</h2>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={submissionTitle}
                                onChange={(e) => setSubmissionTitle(e.target.value)}
                                placeholder="Your writing title..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="content">Content *</Label>
                            <Textarea
                                id="content"
                                value={submissionContent}
                                onChange={(e) => setSubmissionContent(e.target.value)}
                                placeholder="Write your submission here..."
                                rows={12}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Word count: {wordCount}
                            </p>
                        </div>
                        {submissionError && (
                            <p className="text-sm text-red-500">{submissionError}</p>
                        )}
                        <div className="flex gap-3">
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowSubmitForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">
                        {contest.status === 'voting' ? 'Vote for Your Favorite' : 'Submissions'} ({contest.submissions.length})
                    </h2>
                    {voteError && (
                        <p className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded border border-red-200">
                            {voteError}
                        </p>
                    )}
                </div>

                {sortedSubmissions.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No submissions yet</p>
                ) : (
                    <div className="space-y-4">
                        {sortedSubmissions.map((submission, index) => (
                            <div key={submission._id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {index < 3 && contest.status === 'completed' && (
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {index === 0 ? '🥇 1st' : index === 1 ? '🥈 2nd' : '🥉 3rd'}
                                                </span>
                                            )}
                                            <h3 className="font-semibold">{submission.title}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            By {submission.user.name} • {submission.wordCount} words • {formatDate(submission.submittedAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-sm">
                                            <ThumbsUp className="h-4 w-4" />
                                            {submission.votes}
                                        </span>
                                        {contest.status === 'voting' && (
                                            <Button size="sm" onClick={() => handleVote(submission._id)}>
                                                Vote
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {expandedSubmission === submission._id ? (
                                    <>
                                        <p className="text-sm whitespace-pre-wrap mt-3">{submission.content}</p>
                                        <button
                                            onClick={() => setExpandedSubmission(null)}
                                            className="text-sm text-primary hover:underline mt-2"
                                        >
                                            Show less
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                                            {submission.content}
                                        </p>
                                        <button
                                            onClick={() => setExpandedSubmission(submission._id)}
                                            className="text-sm text-primary hover:underline mt-1"
                                        >
                                            Read more
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
