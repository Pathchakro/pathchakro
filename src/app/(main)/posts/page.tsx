'use client';

import { useState, useEffect } from 'react';
import { PostCard, Post } from '@/components/feed/PostCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { BOOK_CATEGORIES } from '@/lib/constants';
// import { useDebounce } from '@/hooks/use-debounce';
import { useSession } from 'next-auth/react';

export default function PostsPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    // Simple debounce implementation if hook doesn't exist
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchPosts();
    }, [debouncedSearch, category]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (debouncedSearch) queryParams.set('search', debouncedSearch);
            if (category && category !== 'All') queryParams.set('category', category);

            const response = await fetch(`/api/posts?${queryParams.toString()}`);
            const data = await response.json();

            if (data.posts) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 min-h-screen pb-20">
            <h1 className="text-2xl font-bold mb-6">Posts</h1>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
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
                    {BOOK_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </Select>
            </div>

            {/* Posts Grid/List */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <PostCard
                            key={post._id}
                            initialPost={post}
                            currentUserId={session?.user?.id}
                            onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    No posts found matching your criteria.
                </div>
            )}
        </div>
    );
}
