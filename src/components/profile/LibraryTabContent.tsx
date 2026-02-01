'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Library } from 'lucide-react';
import { BookCard } from '@/components/BookCard';
import { CATEGORIES } from '@/lib/constants';

interface LibraryItem {
    _id: string;
    book: {
        _id: string;
        title: string;
        author: string;
        category: string[];
        coverImage?: string;
        averageRating: number;
        totalReviews: number;
        slug: string;
        description?: string;
        pdfUrl?: string;
    };
    status: string;
    isOwned: boolean;
    addedAt: string;
    personalRating?: number;
    personalNotes?: string;
}

interface LibraryTabContentProps {
    userId: string;
    isOwnProfile: boolean;
}

export function LibraryTabContent({ userId, isOwnProfile }: LibraryTabContentProps) {
    const [library, setLibrary] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [authorFilter, setAuthorFilter] = useState('');

    // Default to 'owned' (My Collection) as requested, removing 'all'
    const [statusTab, setStatusTab] = useState('owned');

    useEffect(() => {
        fetchLibrary();
    }, [userId]);

    const fetchLibrary = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/library?userId=${userId}`);
            const data = await response.json();

            if (data.library) {
                const validItems = data.library.filter((item: LibraryItem) => item.book);
                setLibrary(validItems);
            }
        } catch (error) {
            console.error('Error fetching library:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBook = async (itemId: string) => {
        if (!confirm('Remove this book from your library?')) return;

        try {
            const response = await fetch(`/api/library/${itemId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchLibrary();
            }
        } catch (error) {
            console.error('Error removing book:', error);
        }
    };

    const handleUpdateStatus = async (itemId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/library/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                if (newStatus) {
                    toast.success(`Marked as ${newStatus.replace(/-/g, ' ')}`);
                } else {
                    toast.success("Status removed");
                }
                fetchLibrary();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const getFilteredLibrary = () => {
        let items = library.filter(item => item.book);

        // Status/Tab Filter
        if (statusTab === 'owned') {
            items = items.filter(item => item.isOwned);
        } else {
            items = items.filter(item => item.status === statusTab);
        }

        // Search Filter
        if (authorFilter) {
            items = items.filter(item =>
                item.book.author.toLowerCase().includes(authorFilter.toLowerCase()) ||
                item.book.title.toLowerCase().includes(authorFilter.toLowerCase())
            );
        }

        // Category Filter
        if (categoryFilter) {
            items = items.filter(item => item.book.category.includes(categoryFilter));
        }

        return items;
    };

    const getStatusCounts = () => {
        return {
            owned: library.filter(i => i.isOwned).length,
            'want-to-read': library.filter(i => i.status === 'want-to-read').length,
            reading: library.filter(i => i.status === 'reading').length,
            completed: library.filter(i => i.status === 'completed').length,
        };
    };

    const filteredItems = getFilteredLibrary();
    const counts = getStatusCounts();

    return (
        <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="space-y-6 mb-6">
                {/* Search and Filter Section */}
                <div className="flex gap-4 w-full">
                    <div className="relative w-[60%]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            value={authorFilter}
                            onChange={(e) => setAuthorFilter(e.target.value)}
                            placeholder="Search by title or author..."
                            className="pl-8 h-9 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full h-9"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Tabs Section */}
                <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-auto">
                        <TabsTrigger value="owned">My Collection ({counts.owned})</TabsTrigger>
                        <TabsTrigger value="reading">Reading ({counts.reading})</TabsTrigger>
                        <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
                        <TabsTrigger value="want-to-read">Want to Read ({counts['want-to-read']})</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading library...
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                    <Library className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <h3 className="tex-lg font-medium mb-1">No books in this list</h3>
                    <p className="text-sm text-muted-foreground">
                        {statusTab === 'owned'
                            ? "This collection is empty."
                            : `No books marked as '${statusTab.replace(/-/g, ' ')}'.`
                        }
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredItems.map((item) => (
                        <BookCard
                            key={item._id}
                            book={item.book}
                            status={item.status}
                            isOwned={item.isOwned}
                            onUpdateStatus={isOwnProfile ? (bookId, status) => handleUpdateStatus(item._id, status) : async () => { }}
                            onAddToLibrary={() => { }}
                            onRemoveFromLibrary={isOwnProfile ? () => handleRemoveBook(item._id) : undefined}
                            showRemoveOption={isOwnProfile}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
