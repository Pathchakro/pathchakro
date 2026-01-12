'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Trophy, Calendar, Users, Award } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Contest {
    _id: string;
    title: string;
    description: string;
    category: string;
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    status: string;
    prize: {
        first: string;
        second: string;
        third: string;
    };
    submissions: any[];
    winners: {
        first?: { user: { name: string; image?: string } };
        second?: { user: { name: string; image?: string } };
        third?: { user: { name: string; image?: string } };
    };
}

export default function ContestsPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchContests();
    }, [categoryFilter, statusFilter]);

    const fetchContests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.append('category', categoryFilter);
            if (statusFilter) params.append('status', statusFilter);

            const response = await fetch(`/api/contests?${params}`);
            const data = await response.json();

            if (data.contests) {
                setContests(data.contests);
            }
        } catch (error) {
            console.error('Error fetching contests:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const getMonthName = (month: number) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Trophy className="h-8 w-8 text-yellow-500" />
                            Writing Contests
                        </h1>
                        <p className="text-muted-foreground">Monthly writing competitions with prizes</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="literature">Literature</option>
                        <option value="history">History</option>
                        <option value="language">Language</option>
                        <option value="health">Health</option>
                        <option value="technology">Technology</option>
                    </Select>

                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="voting">Voting</option>
                        <option value="completed">Completed</option>
                    </Select>
                </div>
            </div>

            {/* Contests Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading contests...
                </div>
            ) : contests.length === 0 ? (
                <div className="text-center py-12">
                    <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No contests found</h3>
                    <p className="text-muted-foreground">Check back later for new contests!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contests.map((contest) => (
                        <Link
                            key={contest._id}
                            href={`/contests/${contest._id}`}
                            className="bg-card border rounded-lg p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getCategoryColor(contest.category)}`}>
                                            {contest.category}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(contest.status)}`}>
                                            {contest.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg mb-1">{contest.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {contest.description}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{getMonthName(contest.month)} {contest.year}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{contest.submissions.length} submissions</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-yellow-500" />
                                    <span className="font-medium text-yellow-700">1st: {contest.prize.first}</span>
                                </div>
                            </div>

                            {contest.status === 'completed' && contest.winners?.first && (
                                <div className="pt-3 border-t">
                                    <p className="text-xs text-muted-foreground mb-1">Winner</p>
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        {contest.winners.first.user.name}
                                    </p>
                                </div>
                            )}

                            {contest.status === 'active' && (
                                <div className="pt-3 border-t">
                                    <p className="text-sm text-green-600 font-medium">📝 Accepting submissions</p>
                                </div>
                            )}

                            {contest.status === 'voting' && (
                                <div className="pt-3 border-t">
                                    <p className="text-sm text-purple-600 font-medium">🗳️ Voting open</p>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
