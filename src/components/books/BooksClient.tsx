'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Book, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';
import { LoginModal } from '@/components/auth/LoginModal';
import { BookCard, type BookItem } from '@/components/BookCard';
import { Pagination } from '@/components/ui/Pagination';

interface BooksClientProps {
    initialBooks: BookItem[];
    pagination: {
        totalBooks: number;
        totalPages: number;
        currentPage: number;
    };
}

export default function BooksClient({ initialBooks, pagination }: BooksClientProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
    const [libraryMap, setLibraryMap] = useState<Record<string, { status: string; isOwned: boolean }>>({});
    const [showLoginModal, setShowLoginModal] = useState(false);

    /**
     * Fetch user library status with error handling
     */
    const fetchUserLibrary = useCallback(async () => {
        try {
            const res = await fetch('/api/library');
            if (!res.ok) {
                throw new Error(`Failed to fetch library: ${res.status} ${res.statusText}`);
            }
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
            console.error('[LIBRARY_FETCH_ERROR]:', error);
        }
    }, []);

    /**
     * Handle search and category filters
     */
    const handleSearch = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('q', searchQuery);
        else params.delete('q');

        if (categoryFilter) params.set('category', categoryFilter);
        else params.delete('category');

        params.set('page', '1');
        router.push(`/books?${params.toString()}`);
    }, [searchQuery, categoryFilter, searchParams, router]);

    // Update search query if URL changes (back button etc)
    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
        setCategoryFilter(searchParams.get('category') || '');
    }, [searchParams]);

    // Fetch library map once on mount if authenticated
    useEffect(() => {
        if (session) {
            fetchUserLibrary();
        }
    }, [session, fetchUserLibrary]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentQ = searchParams.get('q') || '';
            const currentCat = searchParams.get('category') || '';

            if (searchQuery !== currentQ || categoryFilter !== currentCat) {
                handleSearch();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, categoryFilter, searchParams, handleSearch]);

    const onPageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`/books?${params.toString()}`);
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
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 min-h-screen">
            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Book Library
                        </h1>

                    </div>
                    <Link href="/books/add">
                        <Button className="h-11 rounded-xl gap-2 shadow-lg hover:shadow-xl transition-all" onClick={(e) => {
                            if (!session) {
                                e.preventDefault();
                                setShowLoginModal(true);
                            }
                        }}>
                            <Plus className="h-5 w-5" />
                            Add New Book
                        </Button>
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title or author..."
                            className="pl-10 h-12 bg-background rounded-xl border-none shadow-sm focus-visible:ring-primary"
                        />
                    </div>

                    <div>
                        <Select
                            value={categoryFilter}
                            onChange={(e: any) => setCategoryFilter(e.target.value)}
                            className="h-12 bg-card rounded-xl border-none shadow-sm focus-visible:ring-primary"
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
            {initialBooks.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                    <Book className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">No books found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        We couldn't find any books matching your current filters. Try adjusting them!
                    </p>
                    <Link href="/books/add">
                        <Button size="lg" className="rounded-xl" onClick={(e) => {
                            if (!session) {
                                e.preventDefault();
                                setShowLoginModal(true);
                            }
                        }}>Add Your First Book</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="flex flex-col gap-8">
                        {initialBooks.map((book) => (
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
                    <div className="flex flex-col items-center gap-6 pb-10">
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={onPageChange}
                        />

                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-6 py-2 rounded-full border-2">
                            Showing <span className="text-foreground">{((pagination.currentPage - 1) * 20) + 1}</span> to <span className="text-foreground">{Math.min(pagination.currentPage * 20, pagination.totalBooks)}</span> of <span className="text-foreground font-bold">{pagination.totalBooks}</span> books
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
