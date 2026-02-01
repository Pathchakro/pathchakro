'use client';

import { toast } from "sonner";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Book, Search, Plus, Star } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';

import { BookCard, BookItem } from '@/components/BookCard';


export default function BooksPage() {
    const [books, setBooks] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [authorFilter, setAuthorFilter] = useState('');
    const [libraryMap, setLibraryMap] = useState<Record<string, { status: string; isOwned: boolean }>>({});

    useEffect(() => {
        fetchBooks();
        fetchUserLibrary();
    }, []);

    const fetchUserLibrary = async () => {
        try {
            const res = await fetch('/api/library');
            const data = await res.json();
            if (data.library) {
                const map: Record<string, { status: string; isOwned: boolean }> = {};
                data.library.forEach((item: any) => {
                    if (item.book) {
                        map[item.book._id] = { status: item.status, isOwned: item.isOwned };
                    }
                });
                setLibraryMap(map);
            }
        } catch (error) {
            console.error('Error fetching library map:', error);
        }
    };

    const handleAddToLibrary = async (bookId: string) => {
        try {
            const res = await fetch('/api/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, isOwned: true }),
            });
            if (res.ok) {
                toast.success("Added to your library collection");
                // Update local map instantly
                setLibraryMap(prev => ({
                    ...prev,
                    [bookId]: { ...prev[bookId], isOwned: true }
                }));
            } else {
                toast.error("Failed to add to library");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleUpdateReadingStatus = async (bookId: string, status: string) => {
        try {
            const res = await fetch('/api/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, status }),
            });
            if (res.ok) {
                if (status) {
                    toast.success(`Marked as ${status.replace(/-/g, ' ')}`);
                } else {
                    toast.success("Status removed");
                }
                // Update local map instantly
                setLibraryMap(prev => ({
                    ...prev,
                    [bookId]: { ...prev[bookId], status }
                }));
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (categoryFilter) {
                params.append('category', categoryFilter);
            }
            if (authorFilter) params.append('q', authorFilter); // API uses q for both title/author

            const response = await fetch(`/api/books?${params}`);
            const data = await response.json();

            if (data.books) {
                setBooks(data.books);
            }
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchBooks();
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Book className="h-8 w-8 text-blue-500" />
                            Book Library
                        </h1>
                        <p className="text-muted-foreground">Discover, review, and share books</p>
                    </div>
                    <Link href="/books/add">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Book
                        </Button>
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by title or author..."
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Select>

                    <Button onClick={handleSearch}>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Books Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading books...
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-12">
                    <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No books found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery || categoryFilter
                            ? 'Try adjusting your search filters'
                            : 'Be the first to add a book!'}
                    </p>
                    <Link href="/books/add">
                        <Button>Add a Book</Button>
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {books.map((book) => (
                        <BookCard
                            key={book._id}
                            book={book}
                            status={libraryMap[book._id]?.status}
                            isOwned={libraryMap[book._id]?.isOwned}
                            onAddToLibrary={handleAddToLibrary}
                            onUpdateStatus={handleUpdateReadingStatus}
                        />
                    ))}
                </div >
            )}
        </div >
    );
}
