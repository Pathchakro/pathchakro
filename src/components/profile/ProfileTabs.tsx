'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/feed/PostCard';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ProfileAbout } from '@/components/profile/ProfileAbout';
import { ProfileLibrary } from '@/components/profile/ProfileLibrary';
import { FileText, User as UserIcon, BookOpen } from 'lucide-react';

interface ProfileTabsProps {
    user: any;
    stats: any;
    posts: any[];
    session: any;
}

export function ProfileTabs({ user, stats, posts, session }: ProfileTabsProps) {
    return (
        <Tabs defaultValue="activity" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
                <TabsTrigger 
                    value="activity" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold transition-none"
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Activity
                </TabsTrigger>
                <TabsTrigger 
                    value="about" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold transition-none"
                >
                    <UserIcon className="h-4 w-4 mr-2" />
                    About
                </TabsTrigger>
                <TabsTrigger 
                    value="library" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 font-semibold transition-none"
                >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Library
                </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-6">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard 
                            key={post._id} 
                            initialPost={post} 
                            currentUserId={session?.user?.id}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 bg-card rounded-lg border border-dashed text-muted-foreground">
                        No recent activity to show.
                    </div>
                )}
            </TabsContent>

            <TabsContent value="about">
                <ProfileAbout user={user} />
            </TabsContent>

            <TabsContent value="library">
                <ProfileLibrary userId={user._id} />
            </TabsContent>
        </Tabs>
    );
}
