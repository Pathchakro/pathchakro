'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Droplet, MapPin, Phone, Search, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export interface DonorUser {
    name: string;
    rankTier: string;
    image?: string;
}

export interface Donor {
    _id: string;
    bloodGroup: BloodGroup;
    location: string;
    phone: string;
    user: DonorUser;
    lastDonationDate?: string | Date;
    willingToTravel: boolean;
    notes?: string;
}

const BLOOD_GROUP_COLORS: Record<BloodGroup | string, string> = {
    'A+': 'bg-red-100 text-red-700', 'A-': 'bg-red-200 text-red-800',
    'B+': 'bg-blue-100 text-blue-700', 'B-': 'bg-blue-200 text-blue-800',
    'O+': 'bg-green-100 text-green-700', 'O-': 'bg-green-200 text-green-800',
    'AB+': 'bg-purple-100 text-purple-700', 'AB-': 'bg-purple-200 text-purple-800',
};

const getBloodGroupColor = (bloodGroup: string | BloodGroup): string => {
    return BLOOD_GROUP_COLORS[bloodGroup] || 'bg-gray-100 text-gray-700';
};

export default function BloodDonorsClient({ initialDonors }: { initialDonors: Donor[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [bloodGroupFilter, setBloodGroupFilter] = useState(searchParams.get('bloodGroup') || '');
    const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');

    const handleFilterChange = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (bloodGroupFilter) params.set('bloodGroup', bloodGroupFilter); else params.delete('bloodGroup');
        if (locationFilter) params.set('location', locationFilter); else params.delete('location');
        router.push(`/blood-donors?${params.toString()}`);
    }, [bloodGroupFilter, locationFilter, router, searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange();
        }, 500);
        return () => clearTimeout(timer);
    }, [handleFilterChange]);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2"><Droplet className="h-8 w-8 text-red-500" /> Find Blood Donors</h1>
                        <p className="text-muted-foreground">Search for blood donors by location and blood group</p>
                    </div>
                    <Link href="/blood-donors/register"><Button className="gap-2"><Plus className="h-4 w-4" /> Register as Donor</Button></Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="Search by location..." className="pl-10 h-11 rounded-xl" />
                    </div>
                    <Select value={bloodGroupFilter} onChange={(e: any) => setBloodGroupFilter(e.target.value)} className="h-11 rounded-xl">
                        <option value="">All Blood Groups</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </Select>
                    <Button onClick={handleFilterChange} variant="outline" className="h-11 rounded-xl"><Search className="h-4 w-4 mr-2" /> Search</Button>
                </div>
            </div>

            {initialDonors.length === 0 ? (
                <div className="text-center py-12">
                    <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No donors found</h3>
                    <Link href="/blood-donors/register"><Button className="rounded-xl">Register as Donor</Button></Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {initialDonors.map((donor) => (
                        <div key={donor._id} className="bg-card border-2 shadow-sm rounded-2xl p-4 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-black text-lg shadow-sm">{donor.bloodGroup}</div>
                                    <div>
                                        <p className="font-bold text-base leading-tight">{donor.user?.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{donor.user?.rankTier}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getBloodGroupColor(donor.bloodGroup)} shadow-sm`}>{donor.bloodGroup}</span>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2.5 group">
                                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <MapPin className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{donor.location}</span>
                                </div>
                                <div className="flex items-center gap-2.5 group">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Phone className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <a href={`tel:${donor.phone}`} className="font-bold text-primary hover:underline">{donor.phone}</a>
                                </div>
                                <div className="pt-2 border-t space-y-2">
                                    {donor.lastDonationDate && (
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                            Last donation: <span className="text-foreground font-bold">{formatDate(donor.lastDonationDate)}</span>
                                        </p>
                                    )}
                                    {donor.willingToTravel && (
                                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                                            <span className="text-lg">✓</span> Willing to travel
                                        </p>
                                    )}
                                    {donor.notes && (
                                        <div className="mt-3 p-2 bg-muted/50 rounded-xl">
                                            <p className="text-[11px] text-muted-foreground italic leading-relaxed">"{donor.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
