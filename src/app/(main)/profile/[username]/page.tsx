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
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

import { IUser } from '@/types';
import LoadingSpinner from '@/components/ui/Loading';
import { ProfilePortfolio } from '@/components/profile/ProfilePortfolio';


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
    const [activeTab, setActiveTab] = useState('about');
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
        const result = await Swal.fire({
            title: 'Delete Tour?',
            text: "Are you sure you want to delete this tour?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            background: 'var(--card)',
            color: 'var(--foreground)'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/tours/${tourId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setTours(prev => prev.filter(t => t._id !== tourId));
                toast.success('Tour deleted successfully');
            } else {
                toast.error('Failed to delete tour');
            }
        } catch (error) {
            console.error('Error deleting tour:', error);
            toast.error('Error deleting tour');
        }
    };

    const isOwnProfile = session?.user?.id === user?._id;

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user || !stats) {
        return (
            <div className="max-w-4xl mx-auto p-4 py-20">
                <div className="bg-card rounded-lg p-8 text-center border">
                    <h2 className="text-xl font-semibold mb-2">User not found</h2>
                    <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <ProfilePortfolio 
                user={user} 
                stats={stats} 
                isOwnProfile={isOwnProfile} 
            />
        </div>
    );
}
