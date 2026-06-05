'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { BarChart3, Users, CheckCircle, Search, BookOpen, Calendar as CalendarIcon, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UserListModal = ({ isOpen, onClose, title, users, bookTitle }: { isOpen: boolean, onClose: () => void, title: string, users: any[], bookTitle: string }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem] border-2">
                <DialogHeader className="pb-4 border-b-2">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                        <Users className="h-6 w-6 text-primary" />
                        {title}
                    </DialogTitle>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{bookTitle} ({users.length})</p>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                    {users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground font-bold">No users found.</div>
                    ) : (
                        <div className="space-y-4">
                            {users.map((user) => (
                                <Link href={`/profile/${user.username || user._id}`} key={user._id} onClick={onClose} className="flex items-center gap-4 p-3 rounded-2xl border-2 hover:bg-muted/50 hover:border-primary/20 transition-all group">
                                    <Avatar className="h-12 w-12 border-2 group-hover:border-primary transition-colors">
                                        <AvatarImage src={user.image} />
                                        <AvatarFallback className="font-black">{(user.name?.[0] || '?').toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <div className="font-black truncate group-hover:text-primary transition-colors">{user.name}</div>
                                        <div className="text-xs font-bold text-muted-foreground truncate uppercase tracking-widest">@{user.username || 'user'}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function ReadingStatusClient({ initialStats, initialSummary, from, to }: { initialStats: any[], initialSummary: any, from: string, to: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [dateRange, setDateRange] = useState({ from, to });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', bookTitle: '', users: [] });

    const handleFilterChange = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('from', dateRange.from);
        params.set('to', dateRange.to);
        if (statusFilter) params.set('status', statusFilter); else params.delete('status');

        const newUrl = `/reading-status?${params.toString()}`;
        if (window.location.search !== `?${params.toString()}`) {
            router.push(newUrl);
        }
    }, [dateRange, statusFilter, searchParams, router]);

    useEffect(() => {
        handleFilterChange();
    }, [handleFilterChange]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const filteredStats = initialStats.filter(book => {
        const title = book.title ?? '';
        const author = book.author ?? '';
        const reading = book.reading ?? 0;
        const completed = book.completed ?? 0;
        const wantToRead = book.wantToRead ?? 0;

        const matchesSearch = !searchQuery ||
            title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            author.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = !statusFilter || (
            statusFilter === 'reading' ? reading > 0 :
                statusFilter === 'completed' ? completed > 0 :
                    wantToRead > 0
        );

        return matchesSearch && matchesStatus;
    });

    const paginatedStats = filteredStats.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="max-w-7xl mx-auto p-4 pb-20 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl">
                        Reading Trends
                    </h1>

                </div>
                <div className="flex flex-wrap items-center gap-3 bg-muted/50 p-2.5 rounded-[1.5rem] border-2 shadow-sm">
                    <CalendarIcon className="h-4 w-4 text-primary ml-2" />
                    <Input type="date" value={dateRange.from} onChange={(e) => setDateRange(p => ({ ...p, from: e.target.value }))} className="w-auto h-10 rounded-xl border-0 font-bold bg-white shadow-inner" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                    <Input type="date" value={dateRange.to} onChange={(e) => setDateRange(p => ({ ...p, to: e.target.value }))} className="w-auto h-10 rounded-xl border-0 font-bold bg-white shadow-inner" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                    <CardContent className="pt-6 flex items-center gap-5">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform"><Users className="h-8 w-8" /></div>
                        <div><p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Readers</p><h3 className="text-3xl font-black">{initialSummary.totalReaders}</h3></div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden group hover:border-purple-200 transition-colors">
                    <CardContent className="pt-6 flex items-center gap-5">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform"><BookOpen className="h-8 w-8" /></div>
                        <div><p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Active Books</p><h3 className="text-3xl font-black">{initialSummary.activeBooks}</h3></div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-2 shadow-sm overflow-hidden group hover:border-green-200 transition-colors">
                    <CardContent className="pt-6 flex items-center gap-5">
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform"><CheckCircle className="h-8 w-8" /></div>
                        <div><p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Range Completed</p><h3 className="text-3xl font-black">{initialSummary.rangeCompleted}</h3></div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[2.5rem] border-2 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 border-b-2 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg"><TrendingUp className="h-5 w-5 text-indigo-500" /></div>
                        <CardTitle className="text-2xl font-black">Book Insights</CardTitle>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search title or author..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 h-12 rounded-2xl border-2 font-medium focus:ring-primary/20"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                            className="h-12 w-full md:w-44 rounded-2xl border-2 font-black bg-white"
                        >
                            <option value="">All Status</option>
                            <option value="reading">Currently Reading</option>
                            <option value="completed">Completed</option>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="font-black p-6">Book Title & Author</TableHead>
                                <TableHead className="text-center font-black">Availability</TableHead>
                                <TableHead className="text-center font-black">Reading</TableHead>
                                <TableHead className="text-center font-black">Completed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedStats.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-bold">No statistics found matching your filters.</TableCell>
                                </TableRow>
                            ) : (
                                paginatedStats.map((book) => (
                                    <TableRow key={book._id} className="hover:bg-muted/10 transition-colors group">
                                        <TableCell className="p-6">
                                            <Link href={`/books/${book.slug || book._id}`} className="font-black text-base hover:text-primary transition-colors block">
                                                {book.title || 'Unknown Title'}
                                            </Link>
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                                {book.author || 'Unknown Author'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={book.copies > 0 ? "default" : "secondary"} className="rounded-lg font-black uppercase tracking-tighter px-3">
                                                {book.copies ?? 0} available
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 text-blue-600 font-black text-lg border border-blue-100">
                                                {book.reading ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-green-50 text-green-600 font-black text-lg border border-green-100">
                                                {book.completed ?? 0}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {filteredStats.length > pageSize && (
                        <div className="p-8 border-t-2 bg-muted/5 flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredStats.length / pageSize)}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
            <UserListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(p => ({ ...p, isOpen: false }))}
                title={modalConfig.title}
                users={modalConfig.users}
                bookTitle={modalConfig.bookTitle}
            />
        </div>
    );
}
