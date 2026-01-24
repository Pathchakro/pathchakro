'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Search, Star, BookOpen, Trash2, Library } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BookCard } from '@/components/BookCard';
import { BOOK_CATEGORIES } from '@/lib/constants';

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

export default function MyLibraryPage() {
    const [library, setLibrary] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [authorFilter, setAuthorFilter] = useState('');
    const [statusTab, setStatusTab] = useState('all');

    useEffect(() => {
        fetchLibrary();
    }, []); // Fetch all library items once on mount

    const fetchLibrary = async () => {
        setLoading(true);
        try {
            // Fetch all items to allow client-side filtering and accurate counts
            const response = await fetch(`/api/library`);
            const data = await response.json();

            if (data.library) {
                // Filter out orphaned items immediately so counts are accurate
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
                fetchLibrary(); // Re-fetch all items to update state
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
                fetchLibrary(); // Re-fetch all items to update state
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
            console.error('Error updating status:', error);
        }
    };

    const getFilteredLibrary = () => {
        // Filter out orphaned items where book might be null
        let items = library.filter(item => item.book);

        // Status/Tab Filter
        if (statusTab === 'owned') {
            items = items.filter(item => item.isOwned);
        } else if (statusTab !== 'all') {
            items = items.filter(item => item.status === statusTab);
        }

        // Search Filter (by author or title)
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
            all: library.length,
            owned: library.filter(i => i.isOwned).length,
            'want-to-read': library.filter(i => i.status === 'want-to-read').length,
            reading: library.filter(i => i.status === 'reading').length,
            completed: library.filter(i => i.status === 'completed').length,
        };
    };

    const filteredLibrary = getFilteredLibrary();
    const counts = getStatusCounts();

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2 mb-4">
                    <Library className="h-8 w-8 text-purple-500" />
                    My Library
                </h1>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={authorFilter}
                            onChange={(e) => setAuthorFilter(e.target.value)}
                            placeholder="Search by title or author..."
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {BOOK_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Select>

                    <Button onClick={fetchLibrary} variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </div>

                {/* Status Tabs */}
                <Tabs value={statusTab} onValueChange={setStatusTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                        <TabsTrigger value="owned">My Collection ({counts.owned})</TabsTrigger>
                        <TabsTrigger value="want-to-read">Want to Read ({counts['want-to-read']})</TabsTrigger>
                        <TabsTrigger value="reading">Reading ({counts.reading})</TabsTrigger>
                        <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Books Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading library...
                </div>
            ) : filteredLibrary.length === 0 ? (
                <div className="text-center py-12">
                    <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
                    <p className="text-muted-foreground mb-4">
                        {categoryFilter || authorFilter
                            ? 'No books match your filters'
                            : 'Start adding books to your collection!'}
                    </p>
                    <Link href="/books">
                        <Button>Browse Books</Button>
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredLibrary.map((item) => (
                        <BookCard
                            key={item._id}
                            book={item.book}
                            status={item.status}
                            isOwned={item.isOwned}
                            onUpdateStatus={(bookId, status) => handleUpdateStatus(item._id, status)}
                            onAddToLibrary={() => { }} // No-op in library
                            onRemoveFromLibrary={() => handleRemoveBook(item._id)}
                            showRemoveOption={true}
                        />
                    ))}
                </div>
            )}
        </div >
    );
}
