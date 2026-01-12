'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { EventsTabContent } from '@/components/profile/EventsTabContent';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, Calendar, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface User {
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
}

interface Stats {
    posts: number;
    reviews: number;
    followers: number;
    following: number;
}

interface Post {
    _id: string;
    content: string;
    type: string;
    privacy: string;
    likes: string[];
    comments: string[];
    shares: number;
    createdAt: string;
}

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;

    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState<Post[]>([]);
    const [tours, setTours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchUserData();
    }, [username]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`/api/users/${username}`);
            const data = await response.json();

            if (data.user) {
                setUser(data.user);
                setStats(data.stats);

                // Fetch user's posts
                const postsResponse = await fetch(`/api/posts?author=${data.user._id}`);
                const postsData = await postsResponse.json();
                if (postsData.posts) {
                    setPosts(postsData.posts);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'tours' && user) {
            fetchUserTours();
        }
    }, [activeTab, user]);

    const fetchUserTours = async () => {
        try {
            const response = await fetch(`/api/tours?userId=${user?._id}`);
            const data = await response.json();
            if (data.tours) {
                setTours(data.tours);
            }
        } catch (error) {
            console.error('Error fetching tours:', error);
        }
    };

    const handleDeleteTour = async (tourId: string) => {
        if (!confirm('Are you sure you want to delete this tour?')) return;

        try {
            const response = await fetch(`/api/tours/${tourId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setTours(prev => prev.filter(t => t._id !== tourId));
            } else {
                alert('Failed to delete tour');
            }
        } catch (error) {
            console.error('Error deleting tour:', error);
            alert('Error deleting tour');
        }
    };

    const { data: session } = useSession();
    const isOwnProfile = session?.user?.id === user?._id;

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    Loading profile...
                </div>
            </div>
        );
    }

    if (!user || !stats) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">User not found</h2>
                    <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <ProfileHeader user={user} stats={stats} isOwnProfile={isOwnProfile} />

            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div className="space-y-4">
                {activeTab === 'events' && (
                    <EventsTabContent userId={user._id} isOwnProfile={isOwnProfile} />
                )}

                {activeTab === 'posts' && (
                    <>
                        {posts.length === 0 ? (
                            <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
                                No posts yet
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post._id} className="bg-card rounded-lg shadow-sm border p-4">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                            {user.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(post.createdAt)} • {post.privacy}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <button className="hover:text-foreground transition-colors flex items-center gap-1">
                                            <Heart className="h-4 w-4" />
                                            <span>{post.likes.length}</span>
                                        </button>
                                        <button className="hover:text-foreground transition-colors flex items-center gap-1">
                                            <MessageCircle className="h-4 w-4" />
                                            <span>{post.comments.length}</span>
                                        </button>
                                        <button className="hover:text-foreground transition-colors flex items-center gap-1">
                                            <Share2 className="h-4 w-4" />
                                            <span>Share</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'about' && (
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold mb-4">About {user.name}</h3>

                        <div className="space-y-4">
                            {user.bio && (
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Bio</h4>
                                    <p className="text-sm">{user.bio}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Profile Type</h4>
                                    <p className="text-sm">{user.profileType}</p>
                                </div>

                                {user.university && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">University</h4>
                                        <p className="text-sm">{user.university}</p>
                                    </div>
                                )}

                                {user.thana && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                                        <p className="text-sm">{user.thana}</p>
                                    </div>
                                )}

                                {user.bloodGroup && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Blood Group</h4>
                                        <p className="text-sm">{user.bloodGroup}</p>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Rank</h4>
                                    <p className="text-sm font-semibold text-primary">{user.rankTier}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Member Since</h4>
                                    <p className="text-sm">{formatDate(user.createdAt)}</p>
                                </div>
                            </div>

                            {user.bookPreferences && user.bookPreferences.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Book Interests</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.bookPreferences.map((pref) => (
                                            <span key={pref} className="text-sm bg-muted px-3 py-1 rounded-full">
                                                {pref}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
                        No reviews yet. Book review system coming soon!
                    </div>
                )}

                {activeTab === 'tours' && (
                    <div className="space-y-4">
                        {tours.length === 0 ? (
                            <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
                                No tours created or joined yet
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tours.map((tour) => (
                                    <div key={tour._id} className="bg-card rounded-lg shadow-sm border overflow-hidden">
                                        <div className="relative h-40 bg-muted">
                                            {/* Placeholder for banner if no image */}
                                            {tour.bannerUrl ? (
                                                <img src={tour.bannerUrl} alt={tour.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <MapPin className="h-10 w-10 opacity-20" />
                                                </div>
                                            )}
                                            {/* Badge for role */}
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${tour.organizer._id === user?._id
                                                        ? 'bg-primary/90 text-primary-foreground'
                                                        : 'bg-secondary/90 text-secondary-foreground'
                                                    }`}>
                                                    {tour.organizer._id === user?._id ? 'Organizer' : 'Participant'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-lg line-clamp-1 mb-2">{tour.title}</h3>

                                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{tour.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>{formatDate(tour.startDate)}</span>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <div className="text-sm font-medium">
                                                    ৳{tour.budget}
                                                </div>

                                                {isOwnProfile && tour.organizer._id === user?._id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => router.push(`/tours/${tour._id}/edit`)}
                                                            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTour(tour._id)}
                                                            className="p-2 hover:bg-red-50 rounded-full text-muted-foreground hover:text-red-600 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push(`/tours/${tour._id}`)}
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
                        Library feature coming soon!
                    </div>
                )}
            </div>
        </div>
    );
}
