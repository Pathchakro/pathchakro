'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Users, MapPin, Building2, Lock, Globe, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { CommentSection } from '@/components/feed/CommentSection';
import Link from 'next/link';

interface Team {
    _id: string;
    name: string;
    description: string;
    slug?: string;
    type: string;
    category: string;
    privacy: string;
    university?: string;
    location?: string;
    leader: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    members: Array<{
        user: {
            _id: string;
            name: string;
            image?: string;
            rankTier: string;
        };
        role: string;
        joinedAt: string;
    }>;
    createdAt: string;
}

interface Post {
    _id: string;
    author: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    content: string;
    privacy: string;
    likes: string[];
    comments: string[];
    shares: number;
    createdAt: string;
}

export default function TeamDetailPage() {
    const params = useParams();
    // Identifier can be ID (legacy) or Slug (new)
    // Since we renamed the folder to [slug], the param key is 'slug'
    const teamIdentifier = params.slug as string;

    const [team, setTeam] = useState<Team | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [activeTab, setActiveTab] = useState('discussion');
    const [loading, setLoading] = useState(true);
    const [isMember, setIsMember] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (teamIdentifier) {
            fetchTeamData();
            fetchTeamPosts();
        }
    }, [teamIdentifier]);

    const toggleComments = (postId: string) => {
        setOpenComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const fetchTeamData = async () => {
        try {
            const response = await fetch(`/api/teams/${teamIdentifier}`);
            const data = await response.json();

            if (data.team) {
                setTeam(data.team);
                // TODO: Check if current user is a member
                setIsMember(false);
            }
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamPosts = async () => {
        try {
            // We use the same identifier for posts. The API needs to support it or we use team._id if available.
            // Ideally posts API also accepts slug, or we wait for team data to get ID.
            // For now assume API handles slug or we need to update API.
            // Let's rely on API handling slug at /api/teams/[id]/posts too.
            const response = await fetch(`/api/teams/${teamIdentifier}/posts`);
            const data = await response.json();

            if (data.posts) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Error fetching team posts:', error);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPost.trim() || !isMember) return;

        setIsPosting(true);
        try {
            const response = await fetch(`/api/teams/${teamIdentifier}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newPost }),
            });

            const data = await response.json();

            if (response.ok && data.post) {
                setPosts([data.post, ...posts]);
                setNewPost('');
            } else {
                alert(data.error || 'Failed to create post');
            }
        } catch (error) {
            console.error('Error creating post:', error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleJoinTeam = async () => {
        setIsJoining(true);
        try {
            const response = await fetch(`/api/teams/${teamIdentifier}/join`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                if (data.joined) {
                    setIsMember(true);
                    fetchTeamData();
                }
                alert(data.message);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error joining team:', error);
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!confirm('Are you sure you want to leave this team?')) return;

        try {
            const response = await fetch(`/api/teams/${teamIdentifier}/leave`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setIsMember(false);
                fetchTeamData();
                alert(data.message);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error leaving team:', error);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
            });
            const data = await response.json();

            setPosts(posts.map(post =>
                post._id === postId
                    ? {
                        ...post, likes: data.liked
                            ? [...post.likes, 'current-user']
                            : post.likes.filter(id => id !== 'current-user')
                    }
                    : post
            ));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    Loading team...
                </div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="max-w-5xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Team not found</h2>
                    <p className="text-muted-foreground mb-4">The team you're looking for doesn't exist.</p>
                    <Link href="/teams">
                        <Button>Browse Teams</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4">
            {/* Team Header */}
            <div className="bg-card rounded-lg shadow-sm border overflow-hidden mb-4">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

                <div className="p-6">
                    <div className="flex items-start gap-4 -mt-16">
                        <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-card shadow-lg">
                            <Users className="h-12 w-12 text-white" />
                        </div>

                        <div className="flex-1 mt-12">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold">{team.name}</h1>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                        <span>{team.type}</span>
                                        <span>•</span>
                                        <div className="flex items-center gap-1">
                                            {team.privacy === 'public' ? (
                                                <Globe className="h-3 w-3" />
                                            ) : (
                                                <Lock className="h-3 w-3" />
                                            )}
                                            <span>{team.privacy}</span>
                                        </div>
                                        {(team.university || team.location) && (
                                            <>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    {team.type === 'University' ? (
                                                        <Building2 className="h-3 w-3" />
                                                    ) : (
                                                        <MapPin className="h-3 w-3" />
                                                    )}
                                                    <span>{team.university || team.location}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <span className="text-sm text-muted-foreground italic border px-3 py-1 rounded-md bg-muted/50">
                                    Membership is managed automatically based on profile
                                </span>
                            </div>

                            <p className="text-sm mt-3">{team.description}</p>

                            <div className="flex gap-6 text-sm mt-4">
                                <div>
                                    <span className="font-semibold">{team.members.length}</span>
                                    <span className="text-muted-foreground ml-1">Members</span>
                                </div>
                                <div>
                                    <span className="font-semibold">{posts.length}</span>
                                    <span className="text-muted-foreground ml-1">Posts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-lg shadow-sm border mb-4">
                <div className="flex overflow-x-auto">
                    {['discussion', 'members', 'about'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'discussion' && (
                    <div className="space-y-4">
                        {/* Create Post Box (only for members) */}
                        {isMember && (
                            <div className="bg-card rounded-lg p-4 shadow-sm border">
                                <form onSubmit={handleCreatePost} className="space-y-3">
                                    <Textarea
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        placeholder="Share something with the team..."
                                        rows={3}
                                        disabled={isPosting}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={!newPost.trim() || isPosting}
                                        >
                                            {isPosting ? 'Posting...' : 'Post'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Posts */}
                        {posts.length === 0 ? (
                            <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
                                {isMember
                                    ? 'No posts yet. Be the first to post in this team!'
                                    : 'Join the team to see and create posts'}
                            </div>
                        ) : (
                            posts.map((post) => (
                                <div key={post._id} className="bg-card rounded-lg shadow-sm border p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                                            {post.author.name[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold">{post.author.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(post.createdAt)}
                                                    </p>
                                                </div>
                                                <button className="text-muted-foreground hover:text-foreground">
                                                    <span className="text-xl">•••</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleLike(post._id)}
                                                className="hover:text-foreground transition-colors flex items-center gap-1"
                                            >
                                                <Heart className={`h-4 w-4 ${post.likes.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                                                <span>{post.likes.length}</span>
                                            </button>
                                            <button
                                                onClick={() => toggleComments(post._id)}
                                                className="hover:text-foreground transition-colors flex items-center gap-1"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                <span>{post.comments.length}</span>
                                            </button>
                                            <button className="hover:text-foreground transition-colors flex items-center gap-1">
                                                <Share2 className="h-4 w-4" />
                                                <span>Share</span>
                                            </button>
                                        </div>
                                        <button className="hover:text-foreground transition-colors">
                                            <Bookmark className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Comment Section */}
                                    <CommentSection
                                        postId={post._id}
                                        postAuthorId={post.author._id}
                                        initialCount={post.comments.length}
                                        isOpen={!!openComments[post._id]}
                                        onToggle={() => toggleComments(post._id)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold mb-4">Members ({team.members.length})</h3>
                        <div className="space-y-3">
                            {team.members.map((member) => (
                                <div key={member.user._id} className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                        {member.user.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{member.user.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.role} • Joined {formatDate(member.joinedAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="bg-card rounded-lg shadow-sm border p-6">
                        <h3 className="font-semibold mb-4">About this team</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                                <p className="text-sm">{team.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Type</h4>
                                    <p className="text-sm">{team.type}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Privacy</h4>
                                    <p className="text-sm capitalize">{team.privacy}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                                    <p className="text-sm">{team.category || 'General'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                                    <p className="text-sm">{formatDate(team.createdAt)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Leader</h4>
                                    <p className="text-sm">{team.leader ? team.leader.name : 'System / Community'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
