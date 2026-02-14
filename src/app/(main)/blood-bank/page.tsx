"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-radix";
import { bdLocations } from "@/lib/bd-locations";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";

interface User {
    _id: string;
    username: string;
    name: string;
    image?: string;
    bloodGroup: string;
    address?: {
        present?: {
            district?: string;
            thana?: string;
        };
    };
    email: string;
    whatsappNumber?: string;
    phone?: string;
    willingToDonateBlood: boolean;
    title?: string;
    lastDateOfDonateBlood?: string;
}

export default function BloodBankPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        bloodGroup: "all",
        district: "all",
        thana: "all",
    });
    const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());

    // Derived state for dependent dropdowns
    const selectedDistrictData = bdLocations
        .flatMap((div) => div.districts)
        .find((d) => d.name === filters.district);

    const thanas = selectedDistrictData ? selectedDistrictData.thanas : [];

    // Reset thana when district changes
    const handleDistrictChange = (value: string) => {
        setFilters((prev) => ({ ...prev, district: value, thana: "all" }));
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (filters.bloodGroup !== "all") query.set("bloodGroup", filters.bloodGroup);
            if (filters.district !== "all") query.set("district", filters.district);
            if (filters.thana !== "all") query.set("thana", filters.thana);

            const res = await fetch(`/api/blood-bank?${query.toString()}`);

            if (!res.ok) {
                console.error("Failed to fetch users", res.status, res.statusText);
                return;
            }

            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "No record";
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    const toggleContact = (userId: string) => {
        setRevealedContacts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Blood Bank</h1>
                    <p className="text-muted-foreground mt-1">
                        Find willing blood donors in your area.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Blood Group</label>
                    <Select
                        value={filters.bloodGroup}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, bloodGroup: value }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Blood Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Groups</SelectItem>
                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                                <SelectItem key={bg} value={bg}>
                                    {bg}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">District</label>
                    <Select value={filters.district} onValueChange={handleDistrictChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Districts</SelectItem>
                            {bdLocations
                                .flatMap((div) => div.districts)
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((district) => (
                                    <SelectItem key={district.name} value={district.name}>
                                        {district.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Thana</label>
                    <Select
                        value={filters.thana}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, thana: value }))
                        }
                        disabled={!selectedDistrictData}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Thana" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Thanas</SelectItem>
                            {thanas.map((thana) => (
                                <SelectItem key={thana} value={thana}>
                                    {thana}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p className="text-lg">No donors found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <Card key={user._id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow border-muted">
                            <CardHeader className="p-0">
                                <div className="h-20 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 relative">
                                    <Badge
                                        className="absolute top-3 right-3 text-lg font-bold px-3 py-1 shadow-sm"
                                        variant="destructive"
                                    >
                                        {user.bloodGroup}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center -mt-10 p-6 pt-0 flex-1">
                                <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                                    <AvatarImage src={user.image} alt={user.name} className="object-cover" />
                                    <AvatarFallback className="text-xl">
                                        {user.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="text-center mt-3 space-y-1 mb-4 w-full">
                                    <h3 className="font-bold text-lg leading-snug">{user.name}</h3>
                                    {(user.title) && (
                                        <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                                            {user.title}
                                        </Badge>
                                    )}
                                </div>

                                {user.lastDateOfDonateBlood && (
                                    <div className="w-full text-center mb-4 bg-muted/30 py-1.5 rounded text-xs font-medium text-muted-foreground">
                                        Last Donated: <span className="text-foreground">{formatDate(user.lastDateOfDonateBlood)}</span>
                                    </div>
                                )}

                                <div className="w-full space-y-4 mt-auto">
                                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/70" />
                                        <span className="text-left font-medium text-foreground/80 leading-snug">
                                            {[
                                                user.address?.present?.thana,
                                                user.address?.present?.district,
                                            ]
                                                .filter(Boolean)
                                                .join(", ") || "Location unavailable"}
                                        </span>
                                    </div>

                                    {revealedContacts.has(user._id) ? (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 border rounded-md p-3 bg-secondary/10">
                                            {user.email && (
                                                <div className="flex items-center gap-2 text-sm overflow-hidden">
                                                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                                                    <span className="truncate" title={user.email}>{user.email}</span>
                                                </div>
                                            )}
                                            {(user.whatsappNumber || user.phone) && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                                                    <span className="font-medium">{user.whatsappNumber || user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}

                                    <Button
                                        variant={revealedContacts.has(user._id) ? "secondary" : "default"}
                                        className="w-full shadow-sm"
                                        onClick={() => toggleContact(user._id)}
                                    >
                                        {revealedContacts.has(user._id) ? "Hide Contact" : "Show Contact"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
