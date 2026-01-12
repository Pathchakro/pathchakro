'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Droplet, MapPin, Phone, Search, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Donor {
    _id: string;
    user: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    bloodGroup: string;
    location: string;
    phone: string;
    lastDonationDate?: string;
    willingToTravel: boolean;
    maxTravelDistance?: number;
    notes?: string;
    createdAt: string;
}

export default function BloodDonorsPage() {
    const [donors, setDonors] = useState<Donor[]>([]);
    const [loading, setLoading] = useState(true);
    const [bloodGroupFilter, setBloodGroupFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    useEffect(() => {
        fetchDonors();
    }, [bloodGroupFilter, locationFilter]);

    const fetchDonors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (bloodGroupFilter) params.append('bloodGroup', bloodGroupFilter);
            if (locationFilter) params.append('location', locationFilter);

            const response = await fetch(`/api/blood-donors?${params}`);
            const data = await response.json();

            if (data.donors) {
                setDonors(data.donors);
            }
        } catch (error) {
            console.error('Error fetching donors:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBloodGroupColor = (bloodGroup: string) => {
        const colors: any = {
            'A+': 'bg-red-100 text-red-700',
            'A-': 'bg-red-200 text-red-800',
            'B+': 'bg-blue-100 text-blue-700',
            'B-': 'bg-blue-200 text-blue-800',
            'O+': 'bg-green-100 text-green-700',
            'O-': 'bg-green-200 text-green-800',
            'AB+': 'bg-purple-100 text-purple-700',
            'AB-': 'bg-purple-200 text-purple-800',
        };
        return colors[bloodGroup] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Droplet className="h-8 w-8 text-red-500" />
                            Find Blood Donors
                        </h1>
                        <p className="text-muted-foreground">Search for blood donors by location and blood group</p>
                    </div>
                    <Link href="/blood-donors/register">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Register as Donor
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            placeholder="Search by location (e.g., Dhanmondi, Dhaka)"
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={bloodGroupFilter}
                        onChange={(e) => setBloodGroupFilter(e.target.value)}
                    >
                        <option value="">All Blood Groups</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                    </Select>

                    <Button onClick={fetchDonors} variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Donors List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading donors...
                </div>
            ) : donors.length === 0 ? (
                <div className="text-center py-12">
                    <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No donors found</h3>
                    <p className="text-muted-foreground mb-4">
                        {bloodGroupFilter || locationFilter
                            ? 'Try adjusting your search filters'
                            : 'Be the first to register as a donor!'}
                    </p>
                    <Link href="/blood-donors/register">
                        <Button>Register as Donor</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {donors.map((donor) => (
                        <div
                            key={donor._id}
                            className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                                        {donor.bloodGroup}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{donor.user.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{donor.user.rankTier}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getBloodGroupColor(donor.bloodGroup)}`}>
                                    {donor.bloodGroup}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{donor.location}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a href={`tel:${donor.phone}`} className="text-primary hover:underline">
                                        {donor.phone}
                                    </a>
                                </div>

                                {donor.lastDonationDate && (
                                    <p className="text-xs text-muted-foreground">
                                        Last donation: {formatDate(donor.lastDonationDate)}
                                    </p>
                                )}

                                {donor.willingToTravel && (
                                    <p className="text-xs text-green-600 font-medium">
                                        ✓ Willing to travel {donor.maxTravelDistance ? `(up to ${donor.maxTravelDistance}km)` : ''}
                                    </p>
                                )}

                                {donor.notes && (
                                    <p className="text-xs text-muted-foreground italic mt-2">
                                        "{donor.notes}"
                                    </p>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Registered {formatDate(donor.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
