'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select-radix';
import { Users, Search, Plus, MapPin, GraduationCap, Star, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface Team {
    _id: string;
    slug?: string;
    name: string;
    type: string;
    privacy: string;
    leader?: {
        name?: string;
        image?: string;
    };
    members?: any[];
}

interface TeamsClientProps {
    initialTeams: Team[];
}

export default function TeamsClient({ initialTeams }: TeamsClientProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
    const [activeTab, setActiveTab] = useState(searchParams.get('filter') || 'all');

    const handleFilterChange = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('q', searchQuery); else params.delete('q');
        if (typeFilter !== 'all') params.set('type', typeFilter); else params.delete('type');
        if (activeTab !== 'all') params.set('filter', activeTab); else params.delete('filter');

        const queryString = params.toString();
        router.push(`/teams${queryString ? `?${queryString}` : ''}`);
    }, [searchQuery, typeFilter, activeTab, router, searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange();
        }, 500);
        return () => clearTimeout(timer);
    }, [handleFilterChange]);

    return (
        <div className="container max-w-6xl py-10 space-y-10">
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl">Teams & Groups</h1>

                    </div>
                    {session && (
                        <Button asChild size="lg" className="rounded-2xl font-black shadow-lg hover:shadow-xl transition-all">
                            <Link href="/teams/create">
                                <Plus className="mr-2 h-5 w-5" /> Create New Team
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="bg-card border-2 p-6 rounded-3xl shadow-sm space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-fit">
                            <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-muted/50 p-1 rounded-xl">
                                <TabsTrigger value="all" className="rounded-lg font-bold">Explore All</TabsTrigger>
                                <TabsTrigger value="mine" disabled={!session?.user} className="rounded-lg font-bold">My Teams</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 h-12 rounded-2xl border-2 focus-visible:ring-primary font-bold shadow-inner bg-muted/20"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="h-12 rounded-2xl border-2 font-bold bg-muted/20 hover:bg-muted/30 transition-all">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 shadow-xl">
                                    <SelectItem value="all" className="font-bold">All Categories</SelectItem>
                                    <SelectItem value="University" className="font-bold flex items-center gap-2">
                                        <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-500" /> University</div>
                                    </SelectItem>
                                    <SelectItem value="Thana" className="font-bold flex items-center gap-2">
                                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-500" /> Thana/Location</div>
                                    </SelectItem>
                                    <SelectItem value="Special" className="font-bold flex items-center gap-2">
                                        <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Special Interest</div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {initialTeams.length === 0 ? (
                <div className="text-center py-24 bg-card border-2 border-dashed rounded-3xl animate-in fade-in zoom-in duration-500">
                    <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="h-12 w-12 text-primary/30" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">No Teams Discovered</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your filters or search query to find relevant communities.</p>
                </div>
            ) : (
                <div className="bg-card border-2 shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <Table>
                        <TableHeader className="bg-muted/30 h-14 border-b-2">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground pl-8">Team Presence</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Leadership</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Community</TableHead>
                                <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right pr-8">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y-2">
                            {initialTeams.map((team) => (
                                <TableRow key={team._id} className="group hover:bg-primary/5 transition-all h-20">
                                    <TableCell className="pl-8 py-4">
                                        <Link href={`/teams/${team.slug || team._id}`} className="font-black text-lg group-hover:text-primary transition-colors block leading-none">
                                            {team.name}
                                        </Link>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-muted rounded-md group-hover:bg-background transition-colors">{team.type}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">• {team.privacy}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                                                <AvatarImage src={team.leader?.image} />
                                                <AvatarFallback className="font-black bg-gradient-to-br from-blue-400 to-indigo-600 text-white">
                                                    {team.leader?.name?.charAt(0).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-sm leading-tight">{team.leader?.name || 'Pathchakro System'}</p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Founder</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-4">
                                        <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-1.5 rounded-xl border-2 group-hover:bg-background transition-colors">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span className="font-black text-base leading-none">{team.members?.length || 1}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8 py-4">
                                        <Button asChild size="sm" variant="ghost" className="rounded-xl font-black group-hover:bg-primary group-hover:text-white transition-all h-10 px-6">
                                            <Link href={`/teams/${team.slug || team._id}`}>
                                                Join <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
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
