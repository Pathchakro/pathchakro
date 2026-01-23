'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useInView } from 'react-intersection-observer';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';
import { CommentSection } from '@/components/feed/CommentSection';
import { PostCard, Post } from '@/components/feed/PostCard';
import { Link as LinkIcon, Heart, MessageCircle, Share2, Bookmark, FileText, MoreHorizontal, PenTool, ClipboardList } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';


export default function FeedPage() {
    const { data: session } = useSession();
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
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
                        <PostCard
                            key={post._id}
                            initialPost={post}
                            currentUserId={session?.user?.id}
                        />
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
