'use client';

import { useState, useEffect } from 'react';
import { BookCard } from '@/components/BookCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Library as LibraryIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileLibraryProps {
    userId: string;
}

export function ProfileLibrary({ userId }: ProfileLibraryProps) {
    const [library, setLibrary] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        const fetchLibrary = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/library?userId=${encodeURIComponent(userId)}${filterStatus !== 'all' ? `&status=${encodeURIComponent(filterStatus)}` : ''}`);
                if (res.ok) {
                    const data = await res.json();
                    setLibrary(data.library || []);
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    console.error("Failed to fetch library:", errorData.error || res.statusText);
                    toast.error(errorData.error || "Failed to load library");
                    setLibrary([]);
                }
            } catch (error) {
                console.error("Failed to fetch library", error);
                toast.error("Failed to load library");
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchLibrary();
        }
    }, [userId, filterStatus]);

    const handleUpdateStatus = (bookId: string, status: string) => {
        // Just refresh the list or update local state if needed
        // For simplicity, we can just filter out if it doesn't match current filter
        if (filterStatus !== 'all' && status !== filterStatus) {
            setLibrary(prev => prev.filter(item => item.book?._id !== bookId));
        }
    };

    const handleAddToLibrary = (bookId: string) => {
        // This is usually for adding to owned list, might not need local state update here
    };

    const handleRemoveFromLibrary = (bookId: string) => {
        setLibrary(prev => prev.filter(item => item.book?._id !== bookId));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card border rounded-lg overflow-hidden flex flex-col md:flex-row w-full h-[256px]">
                        <Skeleton className="w-full md:w-48 h-64 md:h-full shrink-0 rounded-none" />
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                            </div>
                            <div className="flex gap-2 pt-4 border-t mt-4">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-8 w-24 rounded-md ml-auto" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const statuses = [
        { id: 'all', label: 'All Books' },
        { id: 'reading', label: 'Reading' },
        { id: 'completed', label: 'Completed' },
        { id: 'want-to-read', label: 'Wishlist' },
    ];

    const filteredLibrary = library.filter(item => item.book);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 pb-2">
                {statuses.map((status) => (
                    <button
                        key={status.id}
                        onClick={() => setFilterStatus(status.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            filterStatus === status.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        {status.label}
                    </button>
                ))}
            </div>

            {filteredLibrary.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {filteredLibrary.map((item) => (
                        <BookCard
                            key={item._id}
                            book={item.book}
                            status={item.status}
                            isOwned={item.isOwned}
                            onUpdateStatus={handleUpdateStatus}
                            onAddToLibrary={handleAddToLibrary}
                            onRemoveFromLibrary={handleRemoveFromLibrary}
                            showRemoveOption={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-card rounded-lg border border-dashed text-muted-foreground">
                    <LibraryIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No books found in this category.</p>
                </div>
            )}
        </div>
    );
}
