'use client';

import { useState, useEffect, useRef } from 'react';
import { PostCard, Post } from '@/components/feed/PostCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Loader2, Search, BookOpen, Star, Heart } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PostsContentProps {
    initialPosts: Post[];
    currentUserId?: string;
    initialBookmarks: string[];
}

export default function PostsContent({
    initialPosts,
    currentUserId,
    initialBookmarks
}: PostsContentProps) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [myBookmarkedIds, setMyBookmarkedIds] = useState<string[]>(initialBookmarks);
    const [activeTab, setActiveTab] = useState('all');

    const isInitialMount = useRef(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        // Skip the initial fetch if the state matches the initial props
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const controller = new AbortController();
        fetchControllerRef.current = controller;
        fetchPosts(controller.signal);

        return () => {
            controller.abort();
        };
    }, [debouncedSearch, category, activeTab]);

    const fetchPosts = async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.set('search', debouncedSearch);
            if (category && category !== 'All') queryParams.set('category', category);

            if (activeTab === 'mine') {
                queryParams.set('filter', 'mine');
            } else if (activeTab === 'favorites') {
                queryParams.set('filter', 'favorites');
            }

            const response = await fetch(`/api/posts?${queryParams.toString()}`, { signal });

            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.posts) {
                setPosts(data.posts);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching posts:', error);
            }
        } finally {
            // Only turn off loading if not aborted (to avoid race conditions with strict mode/fast updates)
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const handleToggleBookmark = (postId: string, isBookmarked: boolean) => {
        setMyBookmarkedIds(prev => {
            if (isBookmarked) {
                return [...prev, postId];
            } else {
                return prev.filter(id => id !== postId);
            }
        });
    };

    // We need to keep myBookmarkedIds in sync if a user bookmarks/unbookmarks a post
    // But PostCard manages its own state optimistically and calls the API
    // If we want the "Favourites" tab to update immediately when unbookmarking, we might need a callback
    // For now, let's just rely on the existing flow. If user unbookmarks in Favorites tab, 
    // it won't disappear until refresh or tab switch, which is often better UX (avoids jumping UI).

    return (
        <div className="space-y-6">
            {/* Search, Filter and Tabs */}
            <div className="space-y-4 mb-6 sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search posts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full sm:w-[180px]"
                    >
                        <option value="All">All Categories</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Select>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all" className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            All Posts
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="flex items-center gap-2" disabled={!currentUserId}>
                            <Star className="h-4 w-4" />
                            My Posts
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="flex items-center gap-2" disabled={!currentUserId}>
                            <Heart className="h-4 w-4" />
                            Favourites
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Posts Grid/List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post._id}
                            initialPost={post}
                            currentUserId={currentUserId}
                            initialIsBookmarked={myBookmarkedIds.includes(post._id)}
                            onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
                            onToggleBookmark={handleToggleBookmark}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                    <div className="mx-auto w-fit p-3 rounded-full bg-muted/50 mb-4">
                        {activeTab === 'favorites' ? (
                            <Heart className="h-6 w-6 text-muted-foreground" />
                        ) : activeTab === 'mine' ? (
                            <Star className="h-6 w-6 text-muted-foreground" />
                        ) : (
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <h3 className="text-lg font-medium text-foreground">
                        {activeTab === 'favorites'
                            ? "No favorite posts yet"
                            : activeTab === 'mine'
                                ? "You haven't created any posts"
                                : "No posts found"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeTab === 'favorites'
                            ? "Bookmark posts you like to see them here."
                            : activeTab === 'mine'
                                ? "Share your thoughts with the community."
                                : "Try adjusting your search criteria."}
                    </p>
                </div>
            )}
        </div>
    );
}
