'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Link as LinkIcon, Calendar, Pencil } from 'lucide-react';
import Link from 'next/link';

interface ProfileHeaderProps {
    user: any;
    isOwnProfile: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
    return (
        <div className="bg-card rounded-lg border shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="h-24 w-24 border-2 border-primary/10 shadow-md">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground uppercase">
                        {user.name?.[0]}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                        {user.rankTier && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold hover:bg-primary/20">
                                {user.rankTier}
                            </Badge>
                        )}
                        {isOwnProfile && (
                            <Link href="/profile/edit">
                                <Button variant="outline" size="sm" className="gap-2 h-8 rounded-full border-primary/20 hover:border-primary">
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Edit Profile</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                    
                    <p className="text-muted-foreground font-medium">@{user.username || 'user'}</p>
                    
                    {user.bio && (
                        <p className="text-foreground/90 max-w-2xl leading-relaxed">{user.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                        {user.location && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                <span>{user.location}</span>
                            </div>
                        )}
                        {user.website && (
                            <div className="flex items-center gap-1.5">
                                <LinkIcon className="h-4 w-4" />
                                <a 
                                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {user.website.replace(/^https?:\/\//, '')}
                                </a>
                            </div>
                        )}
                        {user.createdAt && !isNaN(new Date(user.createdAt).getTime()) && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
