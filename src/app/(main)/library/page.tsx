'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Search, Star, BookOpen, Trash2, Library } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { BookCard } from '@/components/BookCard';
import { CATEGORIES } from '@/lib/constants';
import LoadingSpinner from '@/components/ui/Loading';


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
        copies?: number;
    };
    status: string;
    isOwned: boolean;
    addedAt: string;
    personalRating?: number;
    personalNotes?: string;
}

export default function MyLibraryPage() {
    const [library, setLibrary] = useState<LibraryItem[]>([]);
    const [globalBooks, setGlobalBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [authorFilter, setAuthorFilter] = useState('');
    const [statusTab, setStatusTab] = useState('all');

    useEffect(() => {
        fetchLibrary();
        fetchGlobalBooks();
    }, []); // Fetch all library items once on mount

    const fetchGlobalBooks = async () => {
        try {
            let allBooks: any[] = [];
            let currentPage = 1;
            let totalPages = 1;

            while (currentPage <= totalPages) {
                const response = await fetch(`/api/books?hasCopies=true&limit=100&page=${currentPage}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch global books (Page ${currentPage}): ${response.status} ${errorText}`);
                }

                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    throw new Error(`Failed to parse global books JSON (Page ${currentPage}): ${parseError}`);
                }

                if (data.books) {
                    allBooks = [...allBooks, ...data.books];
                }
                
                if (data.pagination) {
                    totalPages = data.pagination.totalPages;
                } else {
                    break; // No pagination info, stop.
                }
                currentPage++;
            }
            
            setGlobalBooks(allBooks);
        } catch (error) {
            console.error('Error fetching global books:', error);
            toast.error("Failed to load some library data");
        }
    };

    const fetchLibrary = async () => {
        setLoading(true);
        try {
            // Fetch all items to allow client-side filtering and accurate counts
            const response = await fetch(`/api/library?t=${Date.now()}`);
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
        if (!itemId) return;
        const result = await Swal.fire({
            title: 'Remove Book?',
            text: "Are you sure you want to remove this book from your library?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!',
            background: 'var(--card)',
            color: 'var(--foreground)'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/library/${itemId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success("Book removed from library");
                fetchLibrary(); // Re-fetch all items to update state
                fetchGlobalBooks(); // Refresh global counts if needed
            } else {
                toast.error("Failed to remove book");
            }
        } catch (error) {
            toast.error("Something went wrong");
            console.error('Error removing book:', error);
        }
    };

    const addBookToLibrary = async (bookId: string, status?: string) => {
        try {
            const body: any = { bookId, isOwned: true };
            if (status) body.status = status;

            const res = await fetch('/api/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to add book to library: ${res.status}`);
            }

            toast.success(status ? `Status updated to ${status}` : "Added to your library collection");
            fetchLibrary();
            fetchGlobalBooks();
            return true;
        } catch (error: any) {
            console.error('Error adding book to library:', error);
            toast.error(error.message || "Something went wrong while updating your library");
        }
    };

    const handleAddToLibrary = async (bookId: string) => {
        await addBookToLibrary(bookId);
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
                fetchLibrary(); // Re-fetch all items to update state
                fetchGlobalBooks();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
            console.error('Error updating status:', error);
        }
    };

    const getFilteredLibrary = () => {
        let items: LibraryItem[] = [];

        if (statusTab === 'all') {
            // When 'all' is selected, show global books mapped to the current user's library
            items = globalBooks.map((book) => {
                const userLibraryItem = library.find(item => item.book && item.book._id === book._id);
                if (userLibraryItem) {
                    return userLibraryItem;
                }
                return {
                    _id: `global_${book._id}`,
                    book: book,
                    status: '',
                    isOwned: false,
                    addedAt: ''
                } as LibraryItem;
            });
        } else {
            // Filter out orphaned items where book might be null
            items = library.filter(item => item.book);

            // Status/Tab Filter
            if (statusTab === 'owned') {
                items = items.filter(item => item.isOwned);
            } else if (statusTab !== 'all') {
                items = items.filter(item => item.status === statusTab);
            }
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
            all: globalBooks.length,
            owned: library.filter(i => i.isOwned).length,
            'want-to-read': library.filter(i => i.status === 'want-to-read').length,
            reading: library.filter(i => i.status === 'reading').length,
            completed: library.filter(i => i.status === 'completed').length,
        };
    };

    const filteredLibrary = getFilteredLibrary();
    const counts = getStatusCounts();
    const totalCopies = filteredLibrary.reduce((sum, item) => {
        // Fallback to 1 copy if copies is not explicitly set but it's in a collection
        const copies = item.book.copies !== undefined ? item.book.copies : (item.isOwned ? 1 : 0);
        return sum + copies;
    }, 0);

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Library className="h-8 w-8 text-purple-500" />
                        Library
                    </h1>
                    <div className="bg-[#ffab9b]/20 text-[#ff684c] px-4 py-1.5 rounded-full text-sm font-bold border border-[#ff684c]/30 flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        <span>{totalCopies} {totalCopies === 1 ? 'Copy' : 'Copies'}</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={authorFilter}
                            onChange={(e) => setAuthorFilter(e.target.value)}
                            placeholder="Search by title or author..."
                            className="pl-10 h-10"
                        />
                    </div>

                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-10 bg-card"
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Select>
                </div>

                {/* Status Tabs/Select */}
                <div className="md:hidden mb-4">
                    <Select
                        value={statusTab}
                        onChange={(e) => setStatusTab(e.target.value)}
                        className="w-full bg-card font-medium"
                    >
                        <option value="all">All ({counts.all})</option>
                        <option value="owned">My Collection ({counts.owned})</option>
                        <option value="want-to-read">Want to Read ({counts['want-to-read']})</option>
                        <option value="reading">Reading ({counts.reading})</option>
                        <option value="completed">Completed ({counts.completed})</option>
                    </Select>
                </div>

                <div className="hidden md:block">
                    <Tabs value={statusTab} onValueChange={setStatusTab}>
                        <TabsList className="md:grid md:grid-cols-5 no-scrollbar h-auto md:h-10 py-1 md:py-0">
                            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                            <TabsTrigger value="owned">My Collection ({counts.owned})</TabsTrigger>
                            <TabsTrigger value="want-to-read">Want to Read ({counts['want-to-read']})</TabsTrigger>
                            <TabsTrigger value="reading">Reading ({counts.reading})</TabsTrigger>
                            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Books Grid */}
            {loading ? (
                <LoadingSpinner />
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
                    {filteredLibrary.map((item) => {
                        const isInUserLibrary = !item._id.startsWith('global_');
                        return (
                            <BookCard
                                key={item._id}
                                book={item.book}
                                status={item.status}
                                isOwned={item.isOwned}
                                onUpdateStatus={async (bookId, status) => {
                                    if (isInUserLibrary) {
                                        await handleUpdateStatus(item._id, status);
                                    } else {
                                        // Use unified helper to add and set status
                                        await addBookToLibrary(bookId, status);
                                    }
                                }}
                                onAddToLibrary={() => handleAddToLibrary(item.book._id)}
                                onRemoveFromLibrary={() => handleRemoveBook(item._id)}
                                showRemoveOption={isInUserLibrary}
                            />
                        );
                    })}
                </div>
            )}
        </div >
    );
}
