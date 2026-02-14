'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Users, Search, Plus, MapPin, Building2 } from 'lucide-react';

interface Team {
    _id: string;
    name: string;
    description: string;
    type: string;
    category: string;
    privacy: string;
    university?: string;
    location?: string;
    leader: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    members: any[];
    createdAt: string;
    slug?: string;
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from 'next-auth/react';

export default function TeamsPage() {
    const { data: session } = useSession();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('all');

    // Pagination and Sort State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Unused filters removed from state to clean up
    const categoryFilter = 'all';
    const universityFilter = '';
    const locationFilter = '';
    const sortBy = 'createdAt';

    useEffect(() => {
        fetchTeams();
    }, [typeFilter, page, activeTab]); // Added activeTab dependency

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [typeFilter, searchQuery, activeTab]); // Added activeTab dependency

    const fetchTeams = async () => {
        setLoading(true); // Ensure loading state is set true before fetch
        try {
            const params = new URLSearchParams();
            if (activeTab === 'mine') {
                params.append('filter', 'mine');
            }
            if (typeFilter !== 'all') params.append('type', typeFilter);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);
            if (universityFilter) params.append('university', universityFilter);
            if (locationFilter) params.append('location', locationFilter);
            if (searchQuery) params.append('q', searchQuery);

            params.append('page', page.toString());
            params.append('limit', '10');
            params.append('sortBy', sortBy);
            params.append('order', 'desc');

            const response = await fetch(`/api/teams?${params}`);
            const data = await response.json();

            if (data.teams) {
                setTeams(data.teams);
            } else {
                setTeams([]); // Handle case where no teams returned
            }
            if (data.pagination) {
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTeams();
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Teams & Groups</h1>
                        <p className="text-muted-foreground">Join communities and connect with others</p>
                    </div>
                    {session && (
                        <Button asChild>
                            <Link href="/teams/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Team
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                            <TabsTrigger value="all">All Teams</TabsTrigger>
                            <TabsTrigger value="mine" disabled={!session?.user}>My Teams</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">Search</Button>
                        </form>

                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-40"
                            >
                                <option value="all">All Types</option>
                                <option value="University">University</option>
                                <option value="Thana">Thana/Location</option>
                                <option value="Special">Special Interest</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams Table */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading teams...
                </div>
            ) : teams.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No teams found</h3>
                    <p className="text-muted-foreground mb-4">
                        {activeTab === 'mine'
                            ? "You haven't joined any teams yet."
                            : (searchQuery ? 'Try a different search term' : 'Be the first to create a team!')}
                    </p>
                    {activeTab === 'mine' && (
                        <Button variant="outline" onClick={() => setActiveTab('all')}>Browse All Teams</Button>
                    )}
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Team Name</TableHead>
                                <TableHead>Team Leader</TableHead>
                                <TableHead>Total Members</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teams.map((team) => (
                                <TableRow key={team._id}>
                                    <TableCell>
                                        <Link
                                            href={`/teams/${team.slug || team._id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {team.name}
                                        </Link>
                                        <div className="text-sm text-muted-foreground">
                                            {team.type} • {team.privacy}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {team.leader ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={team.leader.image} alt={team.leader.name} />
                                                    <AvatarFallback>{team.leader.name?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span>{team.leader.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic">System</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            {team.members.length}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
