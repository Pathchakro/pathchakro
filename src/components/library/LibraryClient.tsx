'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Search, BookOpen, Library as LibraryIcon } from 'lucide-react';
import Link from 'next/link';
import { BookCard } from '@/components/BookCard';
import { CATEGORIES } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function LibraryClient({ initialLibrary, initialGlobalBooks }: { initialLibrary: any[], initialGlobalBooks: any[] }) {
    const router = useRouter();
    const [library, setLibrary] = useState(initialLibrary);
    const [globalBooks] = useState(initialGlobalBooks);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [authorFilter, setAuthorFilter] = useState('');
    const [statusTab, setStatusTab] = useState('all');

    useEffect(() => {
        setLibrary(initialLibrary);
    }, [initialLibrary]);

    const handleRemoveBook = async (itemId: string) => {
        const result = await Swal.fire({
            title: 'Remove Book?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
        });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`/api/library/${itemId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Book removed");
                router.refresh();
            }
        } catch (error) { toast.error("Error removing book"); }
    };

    const handleUpdateStatus = async (itemId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/library/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) router.refresh();
        } catch (error) { toast.error("Error updating status"); }
    };

    const handleLocalStatusUpdate = (bookId: string, newStatus: string) => {
        setLibrary(prev => prev.map(item => 
            item.book?._id === bookId ? { ...item, status: newStatus } : item
        ));
        router.refresh();
    };

    const addBookToLibrary = async (bookId: string, status?: string) => {
        try {
            const res = await fetch('/api/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, isOwned: true, status }),
            });
            if (res.ok) {
                toast.success("Updated library");
                router.refresh();
            }
        } catch (error) { toast.error("Error adding book"); }
    };

    const getFilteredLibrary = () => {
        let items = statusTab === 'all' 
            ? globalBooks.map(book => {
                const userItem = library.find(i => i.book?._id === book._id);
                return userItem || { _id: `global_${book._id}`, book, status: '', isOwned: false };
            })
            : library.filter(i => statusTab === 'owned' ? i.isOwned : i.status === statusTab);

        if (authorFilter) {
            items = items.filter(i => i.book?.title.toLowerCase().includes(authorFilter.toLowerCase()) || i.book?.author.toLowerCase().includes(authorFilter.toLowerCase()));
        }
        if (categoryFilter) {
            items = items.filter(i => i.book?.category.includes(categoryFilter));
        }
        return items;
    };

    const filteredLibrary = getFilteredLibrary();
    const totalCopies = filteredLibrary.reduce((sum, i) => sum + (i.book?.copies || (i.isOwned ? 1 : 0)), 0);

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold flex items-center gap-2"><LibraryIcon className="h-8 w-8 text-purple-500" /> Library</h1>
                    <div className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold border border-orange-200 flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" /> <span>{totalCopies} Copies</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} placeholder="Search..." className="pl-10 h-10" />
                    </div>
                    <Select value={categoryFilter} onChange={(e: any) => setCategoryFilter(e.target.value)} className="h-10 bg-card">
                        <option value="">All Categories</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                </div>

                <Tabs value={statusTab} onValueChange={setStatusTab}>
                    <TabsList className="grid grid-cols-5 h-10">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="owned">Collection</TabsTrigger>
                        <TabsTrigger value="want-to-read">To Read</TabsTrigger>
                        <TabsTrigger value="reading">Reading</TabsTrigger>
                        <TabsTrigger value="completed">Done</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {filteredLibrary.length === 0 ? (
                <div className="text-center py-12">
                    <LibraryIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Library is empty</h3>
                    <Link href="/books"><Button>Browse Books</Button></Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredLibrary.map((item) => {
                        const isInLibrary = !item._id.startsWith('global_');
                        return (
                            <BookCard
                                key={item._id}
                                book={item.book}
                                status={item.status}
                                isOwned={item.isOwned}
                                onUpdateStatus={handleLocalStatusUpdate}
                                onAddToLibrary={() => addBookToLibrary(item.book._id)}
                                onRemoveFromLibrary={() => handleRemoveBook(item._id)}
                                showRemoveOption={isInLibrary}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
