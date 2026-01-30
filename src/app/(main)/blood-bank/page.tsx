'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Droplet, Plus, Search, MapPin, Phone } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface BloodRequest {
    _id: string;
    requester: {
        _id: string;
        name: string;
        image?: string;
    };
    patientName: string;
    bloodType: string;
    unitsNeeded: number;
    urgency: string;
    location: string;
    hospital: string;
    contactNumber: string;
    additionalInfo?: string;
    status: string;
    createdAt: string;
    expiresAt: string;
}

export default function BloodDonationPage() {
    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [bloodTypeFilter, setBloodTypeFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [urgencyFilter, setUrgencyFilter] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [bloodTypeFilter, locationFilter, urgencyFilter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (bloodTypeFilter) params.append('bloodType', bloodTypeFilter);
            if (locationFilter) params.append('location', locationFilter);
            if (urgencyFilter) params.append('urgency', urgencyFilter);

            const response = await fetch(`/api/blood-requests?${params}`);
            const data = await response.json();

            if (data.requests) {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching blood requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'bg-red-500';
            case 'urgent': return 'bg-orange-500';
            default: return 'bg-blue-500';
        }
    };

    const getUrgencyTextColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'text-red-500';
            case 'urgent': return 'text-orange-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Blood Donation</h1>
                        <p className="text-muted-foreground">Help save lives by donating blood</p>
                    </div>
                    <Link href="/blood-donation/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Request
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select
                        value={bloodTypeFilter}
                        onChange={(e) => setBloodTypeFilter(e.target.value)}
                    >
                        <option value="">All Blood Types</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                    </Select>

                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            placeholder="Filter by location..."
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={urgencyFilter}
                        onChange={(e) => setUrgencyFilter(e.target.value)}
                    >
                        <option value="">All Urgency Levels</option>
                        <option value="critical">Critical</option>
                        <option value="urgent">Urgent</option>
                        <option value="normal">Normal</option>
                    </Select>
                </div>
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading requests...
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12">
                    <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No active requests</h3>
                    <p className="text-muted-foreground mb-4">
                        {bloodTypeFilter || locationFilter || urgencyFilter
                            ? 'Try adjusting your filters'
                            : 'Be the first to create a blood donation request'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests.map((request) => (
                        <div
                            key={request._id}
                            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow relative"
                        >
                            {/* Urgency Badge */}
                            <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium text-white ${getUrgencyColor(request.urgency)}`}>
                                {request.urgency.toUpperCase()}
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getUrgencyColor(request.urgency)}`}>
                                    {request.bloodType}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{request.patientName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Requested by {request.requester.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDate(request.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Droplet className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{request.unitsNeeded} unit(s) needed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{request.hospital}, {request.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a href={`tel:${request.contactNumber}`} className="text-primary hover:underline">
                                        {request.contactNumber}
                                    </a>
                                </div>
                            </div>

                            {request.additionalInfo && (
                                <p className="text-sm text-muted-foreground mt-3 p-2 bg-muted rounded">
                                    {request.additionalInfo}
                                </p>
                            )}

                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Expires: {formatDate(request.expiresAt)}
                                </p>
                                <Button size="sm" className={getUrgencyColor(request.urgency)}>
                                    Contact Donor
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
