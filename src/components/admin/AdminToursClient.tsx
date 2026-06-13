'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Eye, Calendar, Users, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';

interface Participant {
    user: {
        _id: string;
        name: string;
        image?: string;
    };
    status: 'confirmed' | 'pending' | 'declined';
    joinedAt: string;
}

interface Tour {
    _id: string;
    title: string;
    slug: string;
    destination: string;
    organizer: {
        _id: string;
        name: string;
        image?: string;
    };
    startDate: string;
    endDate: string;
    budget: number;
    status: string;
    participants: Participant[];
}

interface AdminToursClientProps {
    initialTours: Tour[];
}

export default function AdminToursClient({ initialTours }: AdminToursClientProps) {
    const [tours, setTours] = useState<Tour[]>(initialTours);
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const handleParticipantStatus = async (tourSlug: string, userId: string, status: 'confirmed' | 'declined') => {
        setUpdatingUserId(userId);
        try {
            const response = await fetch(`/api/tours/${tourSlug}/participants`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                
                // Update local state
                const updatedTours = tours.map(t => {
                    if (t.slug === tourSlug) {
                        const updatedParticipants = t.participants.map(p => {
                            if (p.user._id === userId) {
                                return { ...p, status };
                            }
                            return p;
                        });
                        const updatedTourObj = { ...t, participants: updatedParticipants };
                        if (selectedTour && selectedTour._id === t._id) {
                            setSelectedTour(updatedTourObj);
                        }
                        return updatedTourObj;
                    }
                    return t;
                });
                setTours(updatedTours);
            } else {
                toast.error(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let className = "";

        switch (status) {
            case 'confirmed':
            case 'completed':
            case 'ongoing':
                variant = "default";
                className = "bg-green-500 hover:bg-green-600 border-transparent text-white";
                break;
            case 'planning':
                variant = "secondary";
                className = "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
                break;
            case 'cancelled':
                variant = "destructive";
                break;
        }

        return (
            <Badge variant={variant} className={className + " capitalize"}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="container py-8 max-w-7xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Manage Tours</h1>
                <p className="text-muted-foreground">Monitor and manage all tours, bookings, and participants.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Active Tours</CardTitle>
                    <CardDescription>Overview of all planning, ongoing, and completed tours.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tour Details</TableHead>
                                <TableHead>Organizer</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Budget</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tours.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No tours found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tours.map((tour) => {
                                    const pendingCount = tour.participants.filter(p => p.status === 'pending').length;
                                    const confirmedCount = tour.participants.filter(p => p.status === 'confirmed').length;

                                    return (
                                        <TableRow key={tour._id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{tour.title}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3" /> {tour.destination}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-xs font-bold">
                                                        {tour.organizer.image ? (
                                                            <Image src={tour.organizer.image} alt={tour.organizer.name} width={32} height={32} />
                                                        ) : (
                                                            tour.organizer.name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium">{tour.organizer.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex flex-col">
                                                    <span>{formatDate(tour.startDate)}</span>
                                                    <span className="text-muted-foreground">to {formatDate(tour.endDate)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                ৳{tour.budget.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span className="font-semibold text-green-600">{confirmedCount} Confirmed</span>
                                                    {pendingCount > 0 && (
                                                        <span className="font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                                            {pendingCount} Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(tour.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/tours/${tour.slug}`} target="_blank">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" title="View Tour Page">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" variant="outline" onClick={() => setSelectedTour(tour)}>
                                                                Manage
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Manage Participants</DialogTitle>
                                                                <DialogDescription>
                                                                    Approve or decline requests to join &quot;{tour.title}&quot;
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <div className="space-y-4 my-4">
                                                                <div className="flex items-center gap-6 p-3 bg-muted/30 rounded-lg text-sm">
                                                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" /> {tour.destination}</span>
                                                                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-muted-foreground" /> {formatDate(tour.startDate)}</span>
                                                                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-muted-foreground" /> ৳{tour.budget}</span>
                                                                </div>

                                                                <h4 className="font-semibold text-sm">Participant List</h4>
                                                                <div className="border rounded-lg overflow-hidden">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow className="bg-muted/50">
                                                                                <TableHead>User</TableHead>
                                                                                <TableHead>Joined At</TableHead>
                                                                                <TableHead>Status</TableHead>
                                                                                <TableHead className="text-right">Action</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {tour.participants.length === 0 ? (
                                                                                <TableRow>
                                                                                    <TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-4">
                                                                                        No participants have requested to join yet.
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ) : (
                                                                                tour.participants.map((participant) => (
                                                                                    <TableRow key={participant.user._id}>
                                                                                        <TableCell className="font-medium text-sm flex items-center gap-2">
                                                                                            <div className="h-6 w-6 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                                                                {participant.user.image ? (
                                                                                                    <Image src={participant.user.image} alt={participant.user.name} width={24} height={24} />
                                                                                                ) : (
                                                                                                    participant.user.name?.charAt(0) || '?'
                                                                                                )}
                                                                                            </div>
                                                                                            {participant.user.name}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-xs text-muted-foreground">
                                                                                            {formatDate(participant.joinedAt)}
                                                                                        </TableCell>
                                                                                        <TableCell className="text-xs font-semibold uppercase">
                                                                                            <span className={
                                                                                                participant.status === 'confirmed' ? 'text-green-600' :
                                                                                                participant.status === 'pending' ? 'text-orange-600' : 'text-red-600'
                                                                                            }>
                                                                                                {participant.status}
                                                                                            </span>
                                                                                        </TableCell>
                                                                                        <TableCell className="text-right">
                                                                                            {participant.user._id !== tour.organizer._id ? (
                                                                                                <div className="flex justify-end gap-1">
                                                                                                    {(participant.status === 'pending' || participant.status === 'declined') && (
                                                                                                        <Button
                                                                                                            size="sm"
                                                                                                            disabled={updatingUserId === participant.user._id}
                                                                                                            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                                                                            onClick={() => handleParticipantStatus(tour.slug, participant.user._id, 'confirmed')}
                                                                                                        >
                                                                                                            {updatingUserId === participant.user._id ? <Loader2 className="animate-spin h-3 w-3" /> : 'Approve'}
                                                                                                        </Button>
                                                                                                    )}
                                                                                                    {participant.status === 'pending' && (
                                                                                                        <Button
                                                                                                            size="sm"
                                                                                                            disabled={updatingUserId === participant.user._id}
                                                                                                            variant="destructive"
                                                                                                            className="h-7 px-2 text-xs"
                                                                                                            onClick={() => handleParticipantStatus(tour.slug, participant.user._id, 'declined')}
                                                                                                        >
                                                                                                            {updatingUserId === participant.user._id ? <Loader2 className="animate-spin h-3 w-3" /> : 'Decline'}
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <Badge variant="outline" className="text-[10px] text-muted-foreground">Organizer</Badge>
                                                                                            )}
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ))
                                                                            )}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
