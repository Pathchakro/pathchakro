'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Trophy, Calendar, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ContestsClient({ initialContests }: { initialContests: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

    /**
     * Memoized filter change handler to prevent stale closures and redundant renders.
     */
    const handleFilterChange = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryFilter) params.set('category', categoryFilter); else params.delete('category');
        if (statusFilter) params.set('status', statusFilter); else params.delete('status');
        
        const newQuery = params.toString();
        const currentQuery = searchParams.toString();
        
        if (newQuery !== currentQuery) {
            router.push(`/contests?${newQuery}`);
        }
    }, [categoryFilter, statusFilter, router, searchParams]);

    /**
     * Debounced effect for filtering to avoid constant URL updates while typing/selecting.
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange();
        }, 500);
        return () => clearTimeout(timer);
    }, [handleFilterChange]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-700';
            case 'active': return 'bg-green-100 text-green-700';
            case 'voting': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'literature': return 'bg-pink-100 text-pink-700';
            case 'history': return 'bg-amber-100 text-amber-700';
            case 'language': return 'bg-cyan-100 text-cyan-700';
            case 'health': return 'bg-emerald-100 text-emerald-700';
            case 'technology': return 'bg-indigo-100 text-indigo-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    /**
     * Get month name with bounds checking for reliability.
     */
    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (month < 1 || month > 12) return 'Unknown';
        return months[month - 1] || 'Unknown';
    };

    return (
        <div className="max-w-6xl mx-auto p-4 pb-20">
            <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black flex items-center gap-3">
                            <Trophy className="h-10 w-10 text-yellow-500 drop-shadow-sm" /> 
                            Writing Contests
                        </h1>
                        <p className="text-muted-foreground mt-1 font-medium">Compete, learn, and win exciting prizes</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 bg-muted/30 p-4 rounded-2xl border-2 shadow-sm">
                    <Select value={categoryFilter} onChange={(e: any) => setCategoryFilter(e.target.value)} className="h-11 rounded-xl bg-background border-none shadow-sm min-w-[160px]">
                        <option value="">All Categories</option>
                        <option value="literature">Literature</option>
                        <option value="history">History</option>
                        <option value="language">Language</option>
                        <option value="health">Health</option>
                        <option value="technology">Technology</option>
                    </Select>
                    <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="h-11 rounded-xl bg-background border-none shadow-sm min-w-[160px]">
                        <option value="">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="voting">Voting</option>
                        <option value="completed">Completed</option>
                    </Select>
                </div>
            </div>

            {initialContests.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
                    <Trophy className="h-20 w-20 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">No contests found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {initialContests.map((contest) => (
                        <Link key={contest._id} href={`/contests/${contest._id}`} className="group bg-card border-2 shadow-sm rounded-3xl p-6 hover:shadow-xl hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${getCategoryColor(contest.category)} shadow-sm`}>{contest.category}</span>
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${getStatusColor(contest.status)} shadow-sm`}>{contest.status}</span>
                                    </div>
                                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{contest.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{contest.description}</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm mb-6 bg-muted/20 p-4 rounded-2xl border-2">
                                <div className="flex items-center gap-2.5 font-medium"><Calendar className="h-4 w-4 text-primary" /><span>{getMonthName(contest.month)} {contest.year}</span></div>
                                <div className="flex items-center gap-2.5 font-medium"><Users className="h-4 w-4 text-primary" /><span>{contest.submissions?.length || 0} participants enrolled</span></div>
                                <div className="flex items-center gap-2.5 font-bold text-yellow-600"><Award className="h-4 w-4 text-yellow-500" /><span>Prize: {contest.prize?.first}</span></div>
                            </div>
                            {contest.status === 'completed' && contest.winners?.first?.user?.name && (
                                <div className="pt-4 border-t-2 border-dashed flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center shadow-sm">
                                            <Trophy className="h-5 w-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Winner</p>
                                            <p className="text-sm font-bold text-foreground">{contest.winners.first.user.name}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-primary uppercase tracking-tighter">View Results →</span>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
