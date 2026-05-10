import { decode } from 'he';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/feed/PostCard';
import { auth } from '@/auth';
import { generateHtml } from '@/lib/server-html';
import { getCachedPostBySlug } from '@/lib/data/posts';
import { Metadata } from 'next';

interface PostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getCachedPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    const images = post.media && post.media.length > 0 ? [post.media[0]] : [];
    const htmlContent = generateHtml(post.content);
    const plainText = htmlContent.replace(/<[^>]*>?/gm, '');
    const decodedText = decode(plainText);
    const description = decodedText.substring(0, 160).trim();

    // Ensure publishedTime is a valid ISO 8601 string
    const publishedTime = post.createdAt ? new Date(post.createdAt).toISOString() : undefined;
    const modifiedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedTime;

    return {
        title: `${post.title || 'Post'} | Pathchakro`,
        description: description,
        openGraph: {
            title: post.title || 'Post',
            description: description,
            images: images,
            type: 'article',
            publishedTime: publishedTime,
            modifiedTime: modifiedTime,
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
    const { slug } = await params;
    const session = await auth();
    
    // Direct database call with unstable_cache
    const post = await getCachedPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // Prepare post for client component (ensure plain JSON-serializable)
    const serializedPost = JSON.parse(JSON.stringify(post));

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <PostCard
                initialPost={serializedPost}
                currentUserId={session?.user?.id}
                isDetailView={true}
            />
        </div>
    );
}
