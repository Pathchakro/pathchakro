import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { Metadata } from 'next';
import { getCachedUserByUsername } from '@/lib/data/users';
import { getCachedPosts } from '@/lib/data/posts';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function generateMetadata(props: { params: Promise<{ username: string }> }): Promise<Metadata> {
    const params = await props.params;
    if (params.username === 'me') {
        return { title: 'My Profile - Pathchakro' };
    }
    
    const data = await getCachedUserByUsername(params.username);
    if (!data?.user) return { title: 'User Not Found' };

    return {
        title: `${data.user.name} (@${data.user.username || 'user'}) - Pathchakro`,
        description: data.user.bio || `Profile of ${data.user.name} on Pathchakro`,
    };
}

export default async function ProfilePage(props: { params: Promise<{ username: string }> }) {
    const params = await props.params;
    const session = await auth();
    
    if (params.username === 'me') {
        if (!session?.user?.id) {
            redirect('/login');
        }
        await dbConnect();
        const dbUser = await User.findById(session.user.id);
        if (dbUser) {
            if (!dbUser.username) {
                const { generateUniqueSlug } = await import('@/lib/slug-utils');
                const generatedUsername = await generateUniqueSlug(User, dbUser.name || 'user', 'username');
                dbUser.username = generatedUsername;
                await dbUser.save();
            }
            redirect(`/profile/${dbUser.username}`);
        } else {
            notFound();
        }
    }
    
    // Direct database call with unstable_cache
    const data = await getCachedUserByUsername(params.username);

    if (!data?.user) {
        notFound();
    }

    const { user, stats } = data;
    const posts = await getCachedPosts({ author: user._id, limit: 10 });
    const isOwnProfile = !!(session?.user?.id && user?._id && String(session.user.id) === String(user._id));

    return (
        <div className="max-w-4xl mx-auto p-4 pb-20">
            <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
            <ProfileStats stats={stats} />
            <ProfileTabs 
                user={user} 
                stats={stats} 
                posts={posts} 
                session={session} 
            />
        </div>
    );
}
