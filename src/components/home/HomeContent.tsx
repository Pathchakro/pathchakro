'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/feed/PostCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { EventCard } from '@/components/events/EventCard';
import { CourseCard } from '@/components/courses/CourseCard';
import { TourCard } from '@/components/tours/TourCard';
import { WritingProjectCard } from '@/components/writing/WritingProjectCard';
import { Loader2, PenTool, ClipboardList, FileText } from 'lucide-react';
import Link from 'next/link';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';

interface HomeContentProps {
    initialItems: any[];
    initialCursor: string | null;
    initialBookmarks: string[];
    session: any;
}

export default function HomeContent({
    initialItems,
    initialCursor,
    initialBookmarks,
    session
}: HomeContentProps) {
    const [items, setItems] = useState<any[]>(initialItems);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(initialCursor);
    const [hasMore, setHasMore] = useState(initialItems.length >= 10);

    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);
    const [myBookmarkedIds, setMyBookmarkedIds] = useState<string[]>(initialBookmarks);

    const fetchFeed = async (nextCursor?: string) => {
        setLoadingMore(true);
        try {
            const url = nextCursor
                ? `/api/feed?limit=10&cursor=${nextCursor}`
                : `/api/feed?limit=10`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                setItems(prev => [...prev, ...data.items]);
                setCursor(data.nextCursor);
                setHasMore(data.items.length === 10);
            }
        } catch (error) {
            console.error('Error fetching feed:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (cursor) {
            fetchFeed(cursor);
        }
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item._id !== id));
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
                                onDelete={handleDeleteItem}
                            />;
                        case 'review':
                            return <ReviewCard
                                key={item._id}
                                review={item}
                                currentUserId={session?.user?.id}
                            />;
                        case 'event':
                            return <EventCard key={item._id} event={item} onDelete={handleDeleteItem} />;
                        case 'course':
                            return <CourseCard key={item._id} course={item} />;
                        case 'tour':
                            return <TourCard key={item._id} tour={item} />;
                        case 'book':
                            return <WritingProjectCard key={item._id} project={item} />;
                        default:
                            return null;
                    }
                })}
            </div>

            {/* Load More Button */}
            {hasMore && (
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

            {!hasMore && items.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>You've reached the end! 🎉</p>
                </div>
            )}

            {items.length === 0 && (
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
