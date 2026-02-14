import { decode } from 'he';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import Comment from '@/models/Comment';
import { PostCard } from '@/components/feed/PostCard';
import { auth } from '@/auth';
import { IPost, IUser } from '@/types';

interface PostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Define the shape of the populated post
interface PopulatedPost extends Omit<IPost, 'author'> {
    author: IUser;
}

import { generateHtml } from '@/lib/server-html';

export async function generateMetadata({ params }: PostPageProps) {
    await connectDB();
    const { slug } = await params;
    const post = await Post.findOne({ slug }).populate('author', 'name') as unknown as PopulatedPost;

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    const images = post.media && post.media.length > 0 ? [post.media[0]] : [];

    // Generate description from content
    const htmlContent = generateHtml(post.content);
    // Strip HTML tags for plain text description
    const plainText = htmlContent.replace(/<[^>]*>?/gm, '');
    const decodedText = decode(plainText);
    const description = decodedText.substring(0, 160).trim();

    return {
        title: `${post.title || 'Post'} | Pathchakro`,
        description: description,
        openGraph: {
            title: post.title || 'Post',
            description: description,
            images: images,
            type: 'article',
            publishedTime: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
            authors: post.author?.name ? [post.author.name] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title || 'Post',
            description: description,
            images: images,
        },
    };
}

export default async function PostPage({ params }: PostPageProps) {
    await connectDB();
    const { slug } = await params;

    // Register models to ensure populate works
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const userModel = User;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const commentModel = Comment;

    try {
        const post = await Post.findOne({ slug })
            .populate('author', 'name image rankTier')
            .lean() as unknown as PopulatedPost;

        if (!post) {
            notFound();
        }

        const session = await auth();

        const serializedPost = {
            ...post,
            _id: post._id.toString(),
            author: {
                ...post.author,
                _id: post.author._id.toString(),
            },
            likes: post.likes.map((id: any) => id.toString()),
            comments: post.comments.map((id: any) => id.toString()),
            createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
        };

        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <PostCard
                    initialPost={serializedPost as any}
                    currentUserId={session?.user?.id}
                />
            </div>
        );
    } catch (error) {
        console.error('Error fetching post:', error);
        notFound();
    }
}
