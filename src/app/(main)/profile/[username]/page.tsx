import { auth } from '@/auth';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { Metadata } from 'next';

const getUserProfile = cache(async (username: string) => {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/users/${username}`, {
            cache: 'no-store', // Always get fresh data for profile
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
});

async function getUserPosts(userId: string) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/posts?author=${userId}&limit=10`, {
            cache: 'no-store',
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.posts || [];
    } catch (error) {
        console.error('Error fetching user posts:', error);
        return [];
    }
}

export async function generateMetadata(props: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const params = await props.params;
    const data = await getUserProfile(params.username);
    if (!data?.user) return { title: 'User Not Found' };

    return {
        title: `${data.user.name} (@${data.user.username || 'user'}) - Pathchakro`,
        description: data.user.bio || `Profile of ${data.user.name} on Pathchakro`,
    };
}

export default async function ProfilePage(props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
    const session = await auth();
    const data = await getUserProfile(params.username);

    if (!data?.user) {
        notFound();
    }

    const { user, stats } = data;
    const posts = await getUserPosts(user._id);
    const isOwnProfile = !!(session?.user?.id && user?._id && String(session.user.id) === String(user._id));

    return (
        <div className="max-w-4xl mx-auto p-4 pb-20">
            {/* simple header */}
            <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
            
            {/* stats row */}
            <ProfileStats stats={stats} />
            
            {/* content tabs */}
            <ProfileTabs 
                user={user} 
                stats={stats} 
                posts={posts} 
                session={session} 
            />
        </div>
    );
}
