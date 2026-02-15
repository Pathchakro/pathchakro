'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { Send } from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { toast } from 'sonner';

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
    replies?: Comment[];
}

interface CommentSectionProps {
    postId: string;
    postAuthorId: string;
    initialCount: number;
    slug?: string;
    isOpen: boolean;
    onToggle: () => void;
}

export function CommentSection({ postId, postAuthorId, initialCount, slug, isOpen, onToggle }: CommentSectionProps) {
    const { data: session } = useSession();
    const { checkBasicAccess } = useAccessControl();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && comments.length === 0) {
            fetchComments();
        }
    }, [isOpen]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const url = slug
                ? `/api/posts/slug/${slug}/comments`
                : `/api/posts/${postId}/comments`;

            const response = await fetch(url);
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

    const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
        e.preventDefault();

        if (!checkBasicAccess()) return;

        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const url = slug
                ? `/api/posts/slug/${slug}/comments`
                : `/api/posts/${postId}/comments`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    parentId
                }),
            });

            const data = await response.json();

            if (data.comment) {
                if (parentId) {
                    // Add reply to the parent comment in state
                    setComments(prev => prev.map(c => {
                        if (c._id === parentId) {
                            return {
                                ...c,
                                replies: [...(c.replies || []), data.comment]
                            };
                        }
                        return c;
                    }));
                    setReplyContent('');
                    setReplyingTo(null);
                } else {
                    setComments(prev => [data.comment, ...prev]);
                    setNewComment('');
                }
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPostAuthor = session?.user?.id === postAuthorId;

    return (
        <div className="border-t pt-3">
            {initialCount > 0 && !isOpen && (
                <button
                    onClick={onToggle}
                    className="text-sm text-muted-foreground hover:text-foreground mb-3"
                >
                    View {initialCount} {initialCount === 1 ? 'comment' : 'comments'}
                </button>
            )}

            {isOpen && (
                <>
                    {/* Add Main Comment Form */}
                    <form onSubmit={(e) => handleSubmit(e)} className="mb-4">
                        <div className="flex gap-2">
                            {session?.user?.image ? (
                                <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                    {session?.user?.name?.[0] || 'U'}
                                </div>
                            )}
                            <div className="flex-1 flex gap-2">
                                <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    rows={1}
                                    className="resize-none text-sm min-h-[40px]"
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
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment._id} className="group">
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                            {comment.author.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-muted rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold">{comment.author.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                            </div>

                                            {/* Reply Button - Only for Post Author */}
                                            {isPostAuthor && (
                                                <div className="flex gap-2 mt-1 ml-1">
                                                    <button
                                                        onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                                        className="text-xs text-muted-foreground hover:text-foreground font-medium"
                                                    >
                                                        Reply
                                                    </button>
                                                </div>
                                            )}

                                            {/* Reply Form */}
                                            {replyingTo === comment._id && (
                                                <form onSubmit={(e) => handleSubmit(e, comment._id)} className="mt-2 ml-2 flex gap-2">
                                                    <Textarea
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder={`Reply to ${comment.author.name}...`}
                                                        rows={1}
                                                        className="resize-none text-sm min-h-[36px]"
                                                        autoFocus
                                                    />
                                                    <Button
                                                        type="submit"
                                                        size="sm"
                                                        disabled={!replyContent.trim() || isSubmitting}
                                                    >
                                                        <Send className="h-3 w-3" />
                                                    </Button>
                                                </form>
                                            )}

                                            {/* Nested Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="mt-2 ml-4 space-y-2 border-l-2 pl-3">
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply._id} className="flex gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                                                                {reply.author.name[0]}
                                                            </div>
                                                            <div className="bg-muted/50 rounded-lg px-3 py-1.5 flex-1">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-xs font-semibold">{reply.author.name}</span>
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {formatDate(reply.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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
