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

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        fetchTeams();
    }, [typeFilter]);

    const fetchTeams = async () => {
        try {
            const params = new URLSearchParams();
            if (typeFilter !== 'all') params.append('type', typeFilter);
            if (searchQuery) params.append('q', searchQuery);

            const response = await fetch(`/api/teams?${params}`);
            const data = await response.json();

            if (data.teams) {
                setTeams(data.teams);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
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
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Teams & Groups</h1>
                        <p className="text-muted-foreground">Join communities and connect with others</p>
                    </div>
                    <Link href="/teams/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Team
                        </Button>
                    </Link>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search teams..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>

                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="md:w-48"
                    >
                        <option value="all">All Types</option>
                        <option value="University">University</option>
                        <option value="Thana">Thana/Location</option>
                        <option value="Special">Special Interest</option>
                    </Select>
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
                        {searchQuery ? 'Try a different search term' : 'Be the first to create a team!'}
                    </p>
                    <Link href="/teams/create">
                        <Button>Create Team</Button>
                    </Link>
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
                                            href={`/teams/${team._id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {team.name}
                                        </Link>
                                        <div className="text-sm text-muted-foreground">
                                            {team.type} • {team.privacy}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={team.leader.image} alt={team.leader.name} />
                                                <AvatarFallback>{team.leader.name?.charAt(0) || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <span>{team.leader.name}</span>
                                        </div>
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
        </div>
    );
}
