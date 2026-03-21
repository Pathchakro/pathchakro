'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/feed/PostCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { EventCard } from '@/components/events/EventCard';
import { CourseCard } from '@/components/courses/CourseCard';
import { TourCard } from '@/components/tours/TourCard';
import { WritingProjectCard } from '@/components/writing/WritingProjectCard';
import { useAppDispatch, useAppSelector } from '@/store';
import { setCreatePostOpen, setSearchQuery as setGlobalSearchQuery } from '@/store/slices/uiSlice';
import { CreateReviewDialog } from '@/components/reviews/CreateReviewDialog';
import {
    FileText,
    BookOpen,
    Star,
    Calendar,
    MapPin,
    GraduationCap,
    MoreHorizontal,
    Search as SearchIcon,
    X,
    Loader2,
    PenTool,
    Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookCard } from '@/components/BookCard';

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
    const dispatch = useAppDispatch();
    const searchQuery = useAppSelector((state) => state.ui.searchQuery);
    const [items, setItems] = useState<any[]>(initialItems);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(initialCursor);
    const [hasMore, setHasMore] = useState(initialItems.length >= 10);

    const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);
    const [myBookmarkedIds, setMyBookmarkedIds] = useState<string[]>(initialBookmarks);

    // Search states
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [activeSearchTab, setActiveSearchTab] = useState('all');

    // Live search effect
    useEffect(() => {
        const controller = new AbortController();

        const fetchResults = async () => {
            const trimmedQuery = searchQuery?.trim();
            if (!trimmedQuery) {
                setSearchResults(null);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(
                    `/api/search?q=${encodeURIComponent(trimmedQuery)}&type=all`,
                    { signal: controller.signal }
                );

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const data = await response.json();
                setSearchResults(data.results);
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    // Ignore aborted requests
                    return;
                }
                console.error('Search error:', error);
                setSearchResults(null);
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        };

        const timer = setTimeout(() => {
            fetchResults();
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery]);

    const tabs = [
        { id: 'all', label: 'All', icon: SearchIcon },
        { id: 'posts', label: 'Posts', icon: FileText, count: searchResults?.posts?.length },
        { id: 'books', label: 'Books', icon: BookOpen, count: searchResults?.books?.length },
        { id: 'reviews', label: 'Reviews', icon: Star, count: searchResults?.reviews?.length },
        { id: 'events', label: 'Events', icon: Calendar, count: searchResults?.events?.length },
        { id: 'tours', label: 'Tours', icon: MapPin, count: searchResults?.tours?.length },
        { id: 'courses', label: 'Courses', icon: GraduationCap, count: searchResults?.courses?.length },
    ];

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
        <div className="max-w-2xl mx-auto pb-8 p-4 min-h-screen">
            {searchQuery?.trim() ? (
                /* Search Results View */
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-sm font-bold italic text-primary">Results for "{searchQuery}"</h1>
                        <button
                            onClick={() => dispatch(setGlobalSearchQuery(''))}
                            className="p-2 hover:bg-muted rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Unified Category Dropdown */}
                    <div className="mb-6 sticky top-16 bg-background z-10 py-2 border-b">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2 bg-muted/30 border-primary/20 hover:border-primary/50 transition-all rounded-xl shadow-sm group">
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const activeTab = tabs.find(t => t.id === activeSearchTab) || tabs[0];
                                            const Icon = activeTab.icon;
                                            return (
                                                <>
                                                    <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                                                    <span className="font-semibold text-foreground">{activeTab.label}</span>
                                                    {activeTab.id !== 'all' && (activeTab.count || 0) > 0 && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                                            {activeTab.count}
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <MoreHorizontal className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px] p-1 rounded-xl shadow-xl border-primary/10">
                                {tabs.map((tab) => (
                                    <DropdownMenuItem
                                        key={tab.id}
                                        onClick={() => setActiveSearchTab(tab.id)}
                                        className={`flex items-center justify-between gap-2 cursor-pointer rounded-lg px-3 py-2.5 my-0.5 transition-colors ${activeSearchTab === tab.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted font-medium'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <tab.icon className={`h-4 w-4 ${activeSearchTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <span>{tab.label}</span>
                                        </div>
                                        {(tab.count || 0) > 0 && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeSearchTab === tab.id ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground'}`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Results Content */}
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                            <p>Searching for partial matches...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {searchResults ? (
                                <>
                                    {/* Posts */}
                                    {(activeSearchTab === 'all' || activeSearchTab === 'posts') && searchResults.posts?.length > 0 && (
                                        <div className="space-y-6">
                                            {searchResults.posts.map((post: any) => (
                                                <PostCard 
                                                    key={post._id} 
                                                    initialPost={post} 
                                                    currentUserId={session?.user?.id} 
                                                    initialIsBookmarked={myBookmarkedIds.includes(post._id)}
                                                    onToggleBookmark={(postId, bookmarked) => {
                                                        setMyBookmarkedIds(prev => 
                                                            bookmarked 
                                                                ? [...prev, postId] 
                                                                : prev.filter(id => id !== postId)
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Books */}
                                    {(activeSearchTab === 'all' || activeSearchTab === 'books') && searchResults.books?.length > 0 && (
                                        <div className="space-y-6">
                                            {searchResults.books.map((book: any) => (
                                                <BookCard key={book._id} book={book} onUpdateStatus={() => { }} onAddToLibrary={() => { }} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Reviews */}
                                    {(activeSearchTab === 'all' || activeSearchTab === 'reviews') && searchResults.reviews?.length > 0 && (
                                        <div className="space-y-6">
                                            {searchResults.reviews.map((review: any) => (
                                                <ReviewCard key={review._id} review={review} currentUserId={session?.user?.id} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Events */}
                                    {(activeSearchTab === 'all' || activeSearchTab === 'events') && searchResults.events?.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {searchResults.events.map((event: any) => (
                                                <EventCard key={event._id} event={event} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Tours */}
                                    {(activeSearchTab === 'all' || activeSearchTab === 'tours') && searchResults.tours?.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {searchResults.tours.map((tour: any) => (
                                                <TourCard key={tour._id} tour={tour} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Courses */}
                                    {(activeSearchTab === 'all' || activeSearchTab === 'courses') && searchResults.courses?.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {searchResults.courses.map((course: any) => (
                                                <CourseCard key={course._id} course={course} currentUserId={session?.user?.id} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Empty Search Result state within category */}
                                    {activeSearchTab !== 'all' && (!searchResults[activeSearchTab] || searchResults[activeSearchTab].length === 0) && (
                                        <div className="text-center py-20 text-muted-foreground">
                                            <p>No results found for this category.</p>
                                        </div>
                                    )}

                                    {/* Empty All state */}
                                    {activeSearchTab === 'all' && ['posts', 'books', 'reviews', 'events', 'tours', 'courses'].every(key => !searchResults[key] || searchResults[key].length === 0) && (
                                        <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                            <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            <p className="text-lg font-medium">No results found for "{searchQuery}"</p>
                                            <p className="text-sm mt-1">Try different keywords or check spelling.</p>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            ) : (
                /* Normal Feed View */
                <>
                    {/* Create Content Section (only if logged in) */}
                    {session && (
                        <div className="bg-card rounded-lg shadow-sm p-4 mb-6 border">
                            <div className="flex gap-3">
                                {session?.user?.image ? (
                                    <div className="h-10 w-10 rounded-full overflow-hidden relative border shadow-sm">
                                        <Image
                                            src={session.user.image}
                                            alt={session.user.name || 'User'}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                        {session?.user?.name?.[0] || 'U'}
                                    </div>
                                )}
                                <button
                                    onClick={() => dispatch(setCreatePostOpen(true))}
                                    className="flex-1 text-left px-4 py-3 rounded-full bg-muted hover:bg-muted/80 transition-colors shadow-inner"
                                >
                                    <span className="text-muted-foreground">What's on your mind?</span>
                                </button>
                            </div>

                            <div className="flex items-center justify-around mt-4 pt-4 border-t">
                                <Link href="/writing/new" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors text-purple-600">
                                    <PenTool className="h-5 w-5" />
                                    <span className="text-sm font-medium hidden sm:inline">Write Book</span>
                                </Link>
                                <button
                                    onClick={() => setIsCreateReviewOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors text-emerald-600"
                                >
                                    <FileText className="h-5 w-5" />
                                    <span className="text-sm font-medium hidden sm:inline">Review</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {items.map((item) => {
                            switch (item.type) {
                                case 'post':
                                    return <PostCard
                                        key={item._id}
                                        initialPost={item}
                                        currentUserId={session?.user?.id}
                                        onDelete={handleDeleteItem}
                                        initialIsBookmarked={myBookmarkedIds.includes(item._id)}
                                        onToggleBookmark={(postId, bookmarked) => {
                                            setMyBookmarkedIds(prev => 
                                                bookmarked 
                                                    ? [...prev, postId] 
                                                    : prev.filter(id => id !== postId)
                                            );
                                        }}
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
                                    return <CourseCard key={item._id} course={item} currentUserId={session?.user?.id} />;
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
                </>
            )}

            <CreateReviewDialog
                open={isCreateReviewOpen}
                onOpenChange={setIsCreateReviewOpen}
            />
        </div>
    );
}
