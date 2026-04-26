'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Book, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { LoginModal } from '@/components/auth/LoginModal';
import { BookCard, type BookItem } from '@/components/BookCard';
import LoadingSpinner from '@/components/ui/Loading';
import { Pagination } from '@/components/ui/Pagination';

export default function BooksPage() {
    const { data: session } = useSession();
    const [books, setBooks] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [libraryMap, setLibraryMap] = useState<Record<string, { status: string; isOwned: boolean }>>({});
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBooks, setTotalBooks] = useState(0);

    const handleAddBookClick = (e: React.MouseEvent) => {
        if (!session) {
            e.preventDefault();
            setShowLoginModal(true);
        }
    };

    // Fetch library map once on mount
    useEffect(() => {
        fetchUserLibrary();
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const prevCategoryRef = useRef(categoryFilter);
    const prevSearchRef = useRef(debouncedSearchQuery);

    // Consolidated effect for fetching books and resetting page
    useEffect(() => {
        const filtersChanged = prevCategoryRef.current !== categoryFilter || prevSearchRef.current !== debouncedSearchQuery;

        if (filtersChanged) {
            prevCategoryRef.current = categoryFilter;
            prevSearchRef.current = debouncedSearchQuery;

            // If filters changed, reset to page 1
            // fetchBooks will be called by the page change if currentPage was not 1
            // otherwise we call it manually here
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchBooks(1);
            }
        } else {
            // Only page changed (or it was the initial load)
            fetchBooks(currentPage);
        }
    }, [currentPage, categoryFilter, debouncedSearchQuery]);

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

    const handleRemoveFromLibrary = async (bookId: string) => {
        try {
            const res = await fetch('/api/library', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId }),
            });
            if (res.ok) {
                toast.success("Removed from your library collection");
                setLibraryMap(prev => ({
                    ...prev,
                    [bookId]: { ...prev[bookId], isOwned: false }
                }));
            } else {
                toast.error("Failed to remove from library");
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
                setLibraryMap(prev => ({
                    ...prev,
                    [bookId]: { ...prev[bookId], status }
                }));
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error("Something went wrong");
        }
    };

    const fetchBooks = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', '20');

            if (debouncedSearchQuery) params.append('q', debouncedSearchQuery);
            if (categoryFilter) {
                params.append('category', categoryFilter);
            }
            params.append('t', Date.now().toString());

            const response = await fetch(`/api/books?${params}`);
            const data = await response.json();

            if (data.books) {
                setBooks(data.books);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                    setTotalBooks(data.pagination.totalBooks);
                }
            }
        } catch (error) {
            console.error('Error fetching books:', error);
            toast.error("Failed to load books");
        } finally {
            setLoading(false);
        }
    };

    // handleSearch removed as it's now automatic

    return (
        <div className="max-w-7xl mx-auto p-4 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            <Book className="h-10 w-10 text-primary" />
                            Book Library
                        </h1>
                        <p className="text-muted-foreground mt-1">Discover, review, and track your reading journey</p>
                    </div>
                    <Link href="/books/add" onClick={handleAddBookClick}>
                        <Button className="gap-2 shadow-lg hover:shadow-xl transition-all">
                            <Plus className="h-5 w-5" />
                            Add New Book
                        </Button>
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title or author..."
                            className="pl-10 h-11 bg-background"
                        />
                    </div>

                    <div>
                        <Select
                            value={categoryFilter}
                            onChange={(e: any) => setCategoryFilter(e.target.value)}
                            className="h-11 bg-card"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Books Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner />
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <Book className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">No books found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {searchQuery || categoryFilter
                            ? "We couldn't find any books matching your current filters. Try adjusting them!"
                            : 'Our library is waiting for its first book. Why not add one?'}
                    </p>
                    <Link href="/books/add" onClick={handleAddBookClick}>
                        <Button size="lg">Add Your First Book</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex flex-col gap-6">
                        {books.map((book) => (
                            <BookCard
                                key={book._id}
                                book={book}
                                status={libraryMap[book._id]?.status}
                                isOwned={libraryMap[book._id]?.isOwned}
                                onAddToLibrary={handleAddToLibrary}
                                onRemoveFromLibrary={handleRemoveFromLibrary}
                                onUpdateStatus={handleUpdateReadingStatus}
                            />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col items-center gap-4">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />

                        <p className="text-sm font-medium text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full border">
                            Showing <span className="text-foreground">{((currentPage - 1) * 20) + 1}</span> to <span className="text-foreground">{Math.min(currentPage * 20, totalBooks)}</span> of <span className="text-foreground font-bold">{totalBooks}</span> books
                        </p>
                    </div>
                </div>
            )}

            <LoginModal
                open={showLoginModal}
                onOpenChange={setShowLoginModal}
                title="Login to Add Books"
                description="Share your favorite books with the community and keep track of your reading journey."
            />
        </div>
    );
}
