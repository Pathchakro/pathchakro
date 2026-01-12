'use client';

import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Briefcase, Heart, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface ProfileHeaderProps {
    user: {
        _id: string;
        name: string;
        email: string;
        image?: string;
        coverImage?: string;
        bio?: string;
        profileType: string;
        university?: string;
        thana?: string;
        bloodGroup?: string;
        bookPreferences?: string[];
        rankTier: string;
        createdAt: string;
    };
    stats: {
        posts: number;
        reviews: number;
        followers: number;
        following: number;
    };
    isOwnProfile?: boolean;
}

export function ProfileHeader({ user, stats, isOwnProfile }: ProfileHeaderProps) {
    const getRankColor = (tier: string) => {
        const colors = {
            'Master': 'from-purple-500 to-pink-500',
            'Scholar': 'from-blue-500 to-cyan-500',
            'Critic': 'from-green-500 to-emerald-500',
            'Reader': 'from-yellow-500 to-orange-500',
            'Beginner': 'from-gray-400 to-gray-500',
        };
        return colors[tier as keyof typeof colors] || colors.Beginner;
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
            {/* Cover Image */}
            <div className={`h-48 bg-gradient-to-r ${getRankColor(user.rankTier)}`}>
                {user.coverImage && (
                    <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
                )}
            </div>

            {/* Profile Info */}
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end -mt-20 md:-mt-16">
                    {/* Avatar */}
                    <div className="relative">
                        <div className={`h-32 w-32 rounded-full border-4 border-card bg-gradient-to-br ${getRankColor(user.rankTier)} flex items-center justify-center text-white font-bold text-4xl shadow-lg`}>
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="h-full w-full rounded-full object-cover" />
                            ) : (
                                user.name[0].toUpperCase()
                            )}
                        </div>
                        {/* Rank Badge */}
                        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            {user.rankTier}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
                        <p className="text-muted-foreground mb-2">{user.profileType}</p>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                            {user.university && (
                                <div className="flex items-center gap-1">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{user.university}</span>
                                </div>
                            )}
                            {user.thana && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{user.thana}</span>
                                </div>
                            )}
                            {user.bloodGroup && (
                                <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    <span>{user.bloodGroup}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {formatDate(user.createdAt)}</span>
                            </div>
                        </div>

                        {user.bio && (
                            <p className="text-sm mb-3 max-w-2xl">{user.bio}</p>
                        )}

                        {user.bookPreferences && user.bookPreferences.length > 0 && (
                            <div className="flex items-start gap-2 mb-3">
                                <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex flex-wrap gap-1">
                                    {user.bookPreferences.map((pref) => (
                                        <span key={pref} className="text-xs bg-muted px-2 py-1 rounded-full">
                                            {pref}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="flex gap-6 text-sm">
                            <div>
                                <span className="font-semibold">{stats.posts}</span>
                                <span className="text-muted-foreground ml-1">Posts</span>
                            </div>
                            <div>
                                <span className="font-semibold">{stats.reviews}</span>
                                <span className="text-muted-foreground ml-1">Reviews</span>
                            </div>
                            <div>
                                <span className="font-semibold">{stats.followers}</span>
                                <span className="text-muted-foreground ml-1">Followers</span>
                            </div>
                            <div>
                                <span className="font-semibold">{stats.following}</span>
                                <span className="text-muted-foreground ml-1">Following</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {isOwnProfile ? (
                            <Link href="/profile/edit">
                                <Button variant="outline">Edit Profile</Button>
                            </Link>
                        ) : (
                            <>
                                <Button>Follow</Button>
                                <Button variant="outline">Message</Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
