'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { CommentSection } from './CommentSection';
import { PostContent } from './PostContent';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Post {
    _id: string;
    author: {
        _id: string;
        name: string;
        image?: string;
        rankTier: string;
    };
    content: string;
    type: string;
    privacy: string;
    category: string;
    likes: string[];
    comments: string[];
    shares: number;
    createdAt: string;
    media?: string[];
    videoUrl?: string;
    title?: string;
    slug?: string;
}

interface PostCardProps {
    initialPost: Post;
    currentUserId?: string;
}

export function PostCard({ initialPost, currentUserId }: PostCardProps) {
    const [post, setPost] = useState<Post>(initialPost);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-slide effect
    useEffect(() => {
        if (!post.media || post.media.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev === (post.media?.length || 1) - 1 ? 0 : prev + 1));
        }, 3000);

        return () => clearInterval(interval);
    }, [post.media]);

    const handleLike = async () => {
        try {
            const response = await fetch(`/api/posts/${post._id}/like`, {
                method: 'POST',
            });
            const data = await response.json();

            setPost(prev => ({
                ...prev,
                likes: data.liked
                    ? [...prev.likes, currentUserId || 'current-user']
                    : prev.likes.filter(id => id !== (currentUserId || 'current-user'))
            }));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleBookmark = () => {
        setIsBookmarked(prev => !prev);
    };

    const handleShare = async () => {
        const shareText = `Check out this post on Pathchakro:\n${post.title || 'New Post'}\n\n${post.content.substring(0, 100)}...`;
        // Use slug if available, fallback to _id
        const shareUrl = `${window.location.origin}/posts/${(post as any).slug || post._id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title || 'Pathchakro Post',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
                navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

    const isLiked = post.likes.includes(currentUserId || 'current-user');

    return (
        <div className="bg-card rounded-lg shadow-sm p-4 mb-4 border">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    {post.author.image ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden">
                            <img
                                src={post.author.image}
                                alt={post.author.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-medium">
                            {post.author.name[0]}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(post.createdAt)} • {post.privacy}
                        </p>
                    </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            {/* Post Title */}
            {(post as any).title && (
                <a href={`/posts/${(post as any).slug || post._id}`} className="block mb-2">
                    <h3 className="text-xl font-bold hover:text-primary transition-colors">
                        {(post as any).title}
                    </h3>
                </a>
            )}

            {/* Post Content */}
            <div className="mb-4">
                <PostContent content={post.content} />

                {/* Image Slider */}
                {post.media && post.media.length > 0 && (
                    <div className="mt-3 relative rounded-md overflow-hidden bg-muted">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {post.media.map((url, index) => (
                                <div key={index} className="w-full flex-shrink-0 aspect-video">
                                    < img
                                        src={url}
                                        alt={`Slide ${index + 1}`}
                                        className="w-full h-full object-contain bg-black/5"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Slider Controls/Indicators */}
                        {post.media.length > 1 && (
                            <>
                                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                                    {post.media.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentSlide(index);
                                            }}
                                            className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? 'bg-primary' : 'bg-white/50 backdrop-blur-sm'
                                                }`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Post Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3 pb-3 border-b">
                <span>{post.likes.length} likes</span>
                <div className="flex gap-3">
                    <span>{post.comments.length} comments</span>
                    <span>{post.shares} shares</span>
                </div>
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                    <button
                        onClick={handleLike}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-sm font-medium">Like</span>
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Comment</span>
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Share</span>
                    </button>
                </div>
                <button
                    onClick={handleBookmark}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
                </button>
            </div>

            {/* Comment Section */}
            <CommentSection postId={post._id} initialCount={post.comments.length} />
        </div>
    );
}
