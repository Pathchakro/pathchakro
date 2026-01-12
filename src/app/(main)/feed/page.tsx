'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useInView } from 'react-intersection-observer';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';
import { CommentSection } from '@/components/feed/CommentSection';
import { Link as LinkIcon, Heart, MessageCircle, Share2, Bookmark, FileText, MoreHorizontal, PenTool, ClipboardList } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Post {
    _id: string;
    author: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    content: string;
    type: string;
    privacy: string;
    likes: string[];
    comments: string[];
    shares: number;
    createdAt: string;
}

export default function FeedPage() {
    const { data: session } = useSession();
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

    const { ref, inView } = useInView({
        threshold: 0,
    });

    useEffect(() => {
        fetchPosts(1);
    }, []);

    useEffect(() => {
        if (inView && hasMore && !loading) {
            fetchPosts(page + 1);
        }
    }, [inView, hasMore, loading]);

    const fetchPosts = async (pageNum: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/posts?page=${pageNum}&limit=10`);
            const data = await response.json();

            if (data.posts) {
                if (pageNum === 1) {
                    setPosts(data.posts);
                } else {
                    setPosts(prev => [...prev, ...data.posts]);
                }
                setPage(pageNum);
                setHasMore(data.posts.length === 10); // If less than 10, no more posts
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
            });
            const data = await response.json();

            setPosts(posts.map(post =>
                post._id === postId
                    ? {
                        ...post, likes: data.liked
                            ? [...post.likes, 'current-user']
                            : post.likes.filter(id => id !== 'current-user')
                    }
                    : post
            ));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleBookmark = (postId: string) => {
        setBookmarkedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    const handleShare = async (post: Post) => {
        const shareText = `Check out this post on Pathchakro:\n\n${post.content.substring(0, 100)}...`;
        const shareUrl = `${window.location.origin}/posts/${post._id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Pathchakro Post',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                // User cancelled or error - fallback to copy
                navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            }
        } else {
            // Fallback for browsers without Web Share API
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-8">
            {/* Create Post Box */}
            <div className="bg-card rounded-lg shadow-sm p-4 mb-4 border">
                <div className="flex gap-3">
                    {session?.user?.image ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                    )}
                    <button
                        onClick={() => setIsCreatePostOpen(true)}
                        className="flex-1 text-left px-4 py-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                        <span className="text-muted-foreground">What's on your mind?</span>
                    </button>
                </div>

                <div className="flex items-center justify-around mt-4 pt-4 border-t">
                    <Link href="/writing/new" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                        <PenTool className="h-5 w-5 text-purple-500" />
                        <span className="text-sm font-medium hidden sm:inline">Write Book</span>
                    </Link>
                    <Link href="/assignments/create" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                        <ClipboardList className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium hidden sm:inline">Create Assignment</span>
                    </Link>
                    <button
                        onClick={() => setIsCreateReviewOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <FileText className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium hidden sm:inline">Review</span>
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            {loading && posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading posts...
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
                </div>
            ) : (
                <>
                    {posts.map((post) => (
                        <div key={post._id} className="bg-card rounded-lg shadow-sm p-4 mb-4 border">
                            {/* Post Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                                        {post.author.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{post.author.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(post.createdAt)} • {post.privacy}
                                        </p>
                                    </div>
                                </div>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Post Content */}
                            <div className="mb-4">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            </div>

                            {/* Post Stats */}
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3 pb-3 border-b">
                                <span>{post.likes.length} likes</span>
                                <div className="flex gap-3">
                                    <span>{post.comments.length} comments</span>
                                    <span>{post.shares} shares</span>
                                </div>
                            </div>

                            {/* Post Actions */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleLike(post._id)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Heart className={`h-5 w-5 ${post.likes.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                                        <span className="text-sm font-medium">Like</span>
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                                        <MessageCircle className="h-5 w-5" />
                                        <span className="text-sm font-medium">Comment</span>
                                    </button>
                                    <button
                                        onClick={() => handleShare(post)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <Share2 className="h-5 w-5" />
                                        <span className="text-sm font-medium">Share</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleBookmark(post._id)}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <Bookmark className={`h-5 w-5 ${bookmarkedPosts.has(post._id) ? 'fill-primary text-primary' : ''}`} />
                                </button>
                            </div>

                            {/* Comment Section */}
                            <CommentSection postId={post._id} initialCount={post.comments.length} />
                        </div>
                    ))}

                    {/* Infinite Scroll Trigger */}
                    {hasMore && (
                        <div ref={ref} className="text-center py-4">
                            <div className="text-muted-foreground">Loading more posts...</div>
                        </div>
                    )}

                    {!hasMore && posts.length > 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You've reached the end! 🎉</p>
                        </div>
                    )}
                </>
            )}

            <CreatePostDialog
                open={isCreatePostOpen}
                onOpenChange={setIsCreatePostOpen}
            />

            <CreateReviewDialog
                open={isCreateReviewOpen}
                onOpenChange={setIsCreateReviewOpen}
            />
        </div>
    );
}
