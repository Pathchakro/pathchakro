'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { EventsTabContent } from '@/components/profile/EventsTabContent';
import { LibraryTabContent } from '@/components/profile/LibraryTabContent';
import { BookmarksTabContent } from '@/components/profile/BookmarksTabContent';
import { MyBooksTabContent } from '@/components/profile/MyBooksTabContent';
import { MapPin, Calendar, Edit, Trash2, Briefcase, GraduationCap, Globe, Github, Linkedin, Facebook, Twitter, Phone, Mail, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { PostCard, Post } from '@/components/feed/PostCard';

import { IUser } from '@/types';

interface Stats {
    posts: number;
    reviews: number;
    followers: number;
    following: number;
}

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const { data: session } = useSession();

    const [user, setUser] = useState<IUser | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState<Post[]>([]);
    const [tours, setTours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [myBookmarkedIds, setMyBookmarkedIds] = useState<string[]>([]);

    useEffect(() => {
        fetchUserData();
    }, [username]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMyBookmarks();
        }
    }, [session?.user?.id]);

    const fetchMyBookmarks = async () => {
        try {
            const response = await fetch(`/api/users/bookmarks?userId=${session?.user?.id}`);
            const data = await response.json();
            if (data.bookmarks) {
                setMyBookmarkedIds(data.bookmarks.map((b: any) => b._id));
            }
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }
    };

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

            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwnProfile={isOwnProfile} />

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
                                <PostCard
                                    key={post._id}
                                    initialPost={post}
                                    currentUserId={session?.user?.id}
                                    initialIsBookmarked={myBookmarkedIds.includes(post._id)}
                                />
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


                            </div>

                            {/* Contact & Personal Details */}
                            <div className="pt-4 border-t">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Globe className="h-4 w-4" /> Personal Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.title && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                                            <p className="text-sm">{user.title}</p>
                                        </div>
                                    )}
                                    {user.email && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                                            <p className="text-sm">{user.email}</p>
                                        </div>
                                    )}
                                    {user.phone && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                                            <p className="text-sm">{user.phone}</p>
                                        </div>
                                    )}
                                    {user.website && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Website</h4>
                                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">{user.website}</a>
                                        </div>
                                    )}
                                    {user.dateOfBirth && (
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Date of Birth</h4>
                                            <p className="text-sm">{new Date(user.dateOfBirth).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Academic */}
                            {(user.academic?.currentEducation || user.academic?.institution || user.academic?.degree) && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" /> Education
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user.academic?.institution && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Institution</h4>
                                                <p className="text-sm">{user.academic.institution}</p>
                                            </div>
                                        )}
                                        {user.academic?.currentEducation && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Current Level</h4>
                                                <p className="text-sm">{user.academic.currentEducation}</p>
                                            </div>
                                        )}
                                        {user.academic?.degree && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Degree</h4>
                                                <p className="text-sm">{user.academic.degree}</p>
                                            </div>
                                        )}
                                        {user.academic?.fieldOfStudy && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Field of Study</h4>
                                                <p className="text-sm">{user.academic.fieldOfStudy}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Career */}
                            {(user.career?.currentPosition || user.career?.company || user.career?.skills) && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" /> Career & Skills
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {user.career?.currentPosition && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Current Position</h4>
                                                <p className="text-sm">{user.career.currentPosition}</p>
                                            </div>
                                        )}
                                        {user.career?.company && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Company</h4>
                                                <p className="text-sm">{user.career.company}</p>
                                            </div>
                                        )}
                                        {user.career?.yearsOfExperience && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground">Experience</h4>
                                                <p className="text-sm">{user.career.yearsOfExperience} Years</p>
                                            </div>
                                        )}
                                    </div>
                                    {user.career?.skills && user.career.skills.length > 0 && (
                                        <div className="mt-3">
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {user.career.skills.map((skill: string, idx: number) => (
                                                    <span key={idx} className="text-xs bg-secondary px-2 py-1 rounded">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Address */}
                            {(user.address?.present || user.address?.permanent) && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Address
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {user.address?.present && (
                                            <div className="space-y-1">
                                                <h5 className="text-sm font-semibold">Present Address</h5>
                                                {user.address.present.division && <p className="text-sm text-muted-foreground">{user.address.present.addressLine}</p>}
                                                <p className="text-sm text-muted-foreground">
                                                    {[user.address.present.thana, user.address.present.district, user.address.present.division].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                        {user.address?.permanent && (
                                            <div className="space-y-1">
                                                <h5 className="text-sm font-semibold">Permanent Address</h5>
                                                {user.address.permanent.division && <p className="text-sm text-muted-foreground">{user.address.permanent.addressLine}</p>}
                                                <p className="text-sm text-muted-foreground">
                                                    {[user.address.permanent.thana, user.address.permanent.district, user.address.permanent.division].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Social */}
                            {user.social && (user.social.linkedin || user.social.github || user.social.twitter || user.social.facebook) && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-3">Social Profiles</h4>
                                    <div className="flex gap-4">
                                        {user.social.linkedin && (
                                            <a href={user.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#0077b5]">
                                                <Linkedin className="h-5 w-5" />
                                            </a>
                                        )}
                                        {user.social.github && (
                                            <a href={user.social.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-black">
                                                <Github className="h-5 w-5" />
                                            </a>
                                        )}
                                        {user.social.facebook && (
                                            <a href={user.social.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#1877F2]">
                                                <Facebook className="h-5 w-5" />
                                            </a>
                                        )}
                                        {user.social.twitter && (
                                            <a href={user.social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#1DA1F2]">
                                                <Twitter className="h-5 w-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Interests (General) */}
                            {user.interests && user.interests.length > 0 && (
                                <div className="pt-4 border-t">
                                    <h4 className="font-medium mb-3">Interests</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.interests.map((interest) => (
                                            <span key={interest} className="text-sm border px-3 py-1 rounded-full">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {user.bookPreferences && user.bookPreferences.length > 0 && (
                                <div className="pt-4 border-t">
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
                    <LibraryTabContent userId={user._id} isOwnProfile={isOwnProfile} />
                )}

                {activeTab === 'bookmarks' && isOwnProfile && (
                    <BookmarksTabContent userId={user._id} currentUserId={session?.user?.id} />
                )}

                {activeTab === 'my-books' && (
                    <MyBooksTabContent userId={user._id} isOwnProfile={isOwnProfile} />
                )}
            </div>
        </div>
    );
}
