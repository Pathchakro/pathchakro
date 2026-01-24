'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Pencil, Trash2, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'sonner';
import { CommentSection } from './CommentSection';
import { PostContent } from './PostContent';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';

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
    onDelete?: (postId: string) => void;
}

export function PostCard({ initialPost, currentUserId, onDelete }: PostCardProps) {
    const [post, setPost] = useState<Post>(initialPost);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const router = useRouter();

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
            const slugOrId = (post as any).slug || post._id;
            const response = await fetch(`/api/posts/slug/${slugOrId}/like`, {
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

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (!result.isConfirmed) return;

        try {
            const slugOrId = (post as any).slug || post._id;
            const response = await fetch(`/api/posts/slug/${slugOrId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Post deleted successfully');
                // If parent component provided a callback (e.g., to remove from list)
                if (onDelete) {
                    onDelete(post._id);
                } else {
                    // Otherwise just refresh or hide locally (reloading for now simpler)
                    window.location.reload();
                }
            } else {
                toast.error('Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error('Error deleting post');
        }
    };

    const handleHide = () => {
        // Just hide visually for this session
        // In a real app, this would probably call an API to hide for the user permanently
        if (confirm('Hide this post?')) {
            const element = document.getElementById(`post-${post._id}`);
            if (element) {
                element.style.display = 'none';
            }
        }
    };

    const isOwnPost = currentUserId === post.author._id;
    const isLiked = post.likes.includes(currentUserId || 'current-user');

    return (
        <div id={`post-${post._id}`} className="bg-card rounded-lg shadow-sm p-4 mb-4 border">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    <Link href={`/profile/${post.author._id}`}>
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
                    </Link>
                    <div>
                        <Link href={`/profile/${post.author._id}`} className="font-semibold hover:underline">
                            {post.author.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            {formatDate(post.createdAt)} • {post.privacy}
                            {post.category && (
                                <>
                                    {' • '}
                                    <Link href={`/posts?category=${post.category}`} className="hover:text-primary hover:underline capitalize">
                                        {post.category}
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isOwnPost ? (
                            <>
                                <DropdownMenuItem onClick={() => router.push(`/posts/${(post as any).slug || post._id}/edit`)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Post
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <DropdownMenuItem onClick={handleHide}>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Post
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
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
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
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
            {/* Comment Section */}
            <CommentSection
                postId={post._id}
                initialCount={post.comments.length}
                slug={(post as any).slug || post._id}
                isOpen={showComments}
                onToggle={() => setShowComments(!showComments)}
            />
        </div>
    );
}
