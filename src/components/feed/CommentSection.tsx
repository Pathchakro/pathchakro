'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { Send } from 'lucide-react';

interface Comment {
    _id: string;
    author: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    content: string;
    createdAt: string;
}

interface CommentSectionProps {
    postId: string;
    initialCount: number;
}

export function CommentSection({ postId, initialCount }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isExpanded && comments.length === 0) {
            fetchComments();
        }
    }, [isExpanded]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            const data = await response.json();
            if (data.comments) {
                setComments(data.comments);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newComment }),
            });

            const data = await response.json();

            if (data.comment) {
                setComments([data.comment, ...comments]);
                setNewComment('');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border-t pt-3">
            {initialCount > 0 && !isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="text-sm text-muted-foreground hover:text-foreground mb-3"
                >
                    View {initialCount} {initialCount === 1 ? 'comment' : 'comments'}
                </button>
            )}

            {isExpanded && (
                <>
                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="flex gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                U
                            </div>
                            <div className="flex-1 flex gap-2">
                                <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={2}
                                    className="resize-none text-sm"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!newComment.trim() || isSubmitting}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Comments List */}
                    {isLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                    ) : (
                        <div className="space-y-3">
                            {comments.map((comment) => (
                                <div key={comment._id} className="flex gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                        {comment.author.name[0]}
                                    </div>
                                    <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold">{comment.author.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
