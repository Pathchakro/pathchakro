'use client';

import { useState, useEffect } from 'react';
import { PostCard, Post } from '@/components/feed/PostCard';
import { Bookmark } from 'lucide-react';

interface BookmarksTabContentProps {
    userId: string;
    currentUserId?: string;
}

export function BookmarksTabContent({ userId, currentUserId }: BookmarksTabContentProps) {
    const [bookmarks, setBookmarks] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookmarks();
    }, [userId]);

    const fetchBookmarks = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/bookmarks?userId=${userId}`);
            const data = await response.json();

            console.log('Bookmarks response:', data);
            if (data.bookmarks) {
                console.log('Setting bookmarks:', data.bookmarks);
                setBookmarks(data.bookmarks);
            } else {
                console.log('No bookmarks field in response');
            }
        } catch (error) {

            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Loading bookmarks...
            </div>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-12 bg-card rounded-lg border shadow-sm">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <h3 className="text-lg font-medium mb-1">No bookmarks yet</h3>
                <p className="text-sm text-muted-foreground">
                    Posts you bookmark will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bookmarks.map((post) => (
                <PostCard
                    key={post._id}
                    initialPost={post}
                    currentUserId={currentUserId}
                    initialIsBookmarked={true}
                    onDelete={(postId) => {
                        // If user deletes their own post from here (unlikely but possible if it's their post)
                        setBookmarks(prev => prev.filter(p => p._id !== postId));
                    }}
                />
            ))}
        </div>
    );
}
