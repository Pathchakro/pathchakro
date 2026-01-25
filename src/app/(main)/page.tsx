'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/feed/PostCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { EventCard } from '@/components/events/EventCard';
import { CourseCard } from '@/components/courses/CourseCard';
import { TourCard } from '@/components/tours/TourCard';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// Helper to create content creation links
import { PenTool, ClipboardList, FileText } from 'lucide-react';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';

export default function HomePage() {
    const { data: session } = useSession();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);

    const [myBookmarkedIds, setMyBookmarkedIds] = useState<string[]>([]);

    useEffect(() => {
        fetchFeed();
    }, []);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMyBookmarks();
        }
    }, [session?.user?.id]);

    const fetchMyBookmarks = async () => {
        try {
            const response = await fetch(`/api/users/bookmarks?userId=${session?.user?.id}`);
            const data = await response.json();
            if (data.bookmarks) {
                setMyBookmarkedIds(data.bookmarks.map((b: any) => b._id));
            }
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }
    };

    const fetchFeed = async (nextCursor?: string) => {
        if (nextCursor) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            const url = nextCursor
                ? `/api/feed?limit=10&cursor=${nextCursor}`
                : `/api/feed?limit=10`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                if (nextCursor) {
                    setItems(prev => [...prev, ...data.items]);
                } else {
                    setItems(data.items);
                }
                setCursor(data.nextCursor);
                setHasMore(data.items.length === 10); // Simple check
            }
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (cursor) {
            fetchFeed(cursor);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-8 p-4">
            {/* Create Content Section (only if logged in) */}
            {session && (
                <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border">
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
                            <span className="text-sm font-medium hidden sm:inline">Assignment</span>
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
            )}

            {/* Feed Items */}
            <div className="space-y-6">
                {items.map((item) => {
                    switch (item.type) {
                        case 'post':
                            return <PostCard
                                key={item._id}
                                initialPost={item}
                                currentUserId={session?.user?.id}
                                initialIsBookmarked={myBookmarkedIds.includes(item._id)}
                            />;
                        case 'review':
                            return <ReviewCard key={item._id} review={item} />;
                        case 'event':
                            return <EventCard key={item._id} event={item} />;
                        case 'course':
                            return <CourseCard key={item._id} course={item} />;
                        case 'tour':
                            return <TourCard key={item._id} tour={item} />;
                        default:
                            return null;
                    }
                })}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Load More Button */}
            {!loading && hasMore && (
                <div className="flex justify-center mt-8">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="min-w-[150px]"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}

            {!loading && !hasMore && items.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>You've reached the end! 🎉</p>
                </div>
            )}

            {!loading && items.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No items found.
                </div>
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
