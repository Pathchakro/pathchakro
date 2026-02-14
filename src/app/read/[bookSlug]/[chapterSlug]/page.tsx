import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ChapterContent } from './ChapterContent';
import { ReaderNavigation } from './ReaderNavigation';
import { ReaderWrapper } from './ReaderWrapper';
import { ReaderInfoSidebar } from './ReaderInfoSidebar';
import { ReaderChapterList } from './ReaderChapterList';

import { generateHtml } from '@/lib/server-html';
import Image from 'next/image';

interface ReaderPageProps {
    params: Promise<{
        bookSlug: string;
        chapterSlug: string;
    }>;
}

export async function generateMetadata({ params }: ReaderPageProps) {
    await dbConnect();
    const resolvedParams = await params;

    // Logic duplicated from component because generateMetadata is separate
    const bookSlug = decodeURIComponent(resolvedParams.bookSlug);
    const chapterSlug = decodeURIComponent(resolvedParams.chapterSlug);

    const projectQuery = (bookSlug.match(/^[0-9a-fA-F]{24}$/))
        ? { _id: bookSlug }
        : { slug: bookSlug };

    const project = await WritingProject.findOne(projectQuery).populate('author', 'name').lean();

    if (!project) {
        return {
            title: 'Chapter Not Found',
        };
    }

    const targetSlug = `${bookSlug}/${chapterSlug}`;
    const chapter = project.chapters.find((c: any) => c.slug === targetSlug || c.slug === chapterSlug);

    if (!chapter) {
        return {
            title: 'Chapter Not Found',
        };
    }

    // Generate description from content
    let description = '';
    if (chapter.content) {
        const htmlContent = generateHtml(chapter.content);
        // Strip HTML and take first 160 chars
        description = htmlContent.replace(/<[^>]*>?/gm, '').substring(0, 160).trim();
    }

    const title = `${chapter.title} | ${project.title}`;
    const images = chapter.image ? [chapter.image] : (project.coverImage ? [project.coverImage] : []);

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: images,
            type: 'article',
            publishedTime: chapter.createdAt instanceof Date ? chapter.createdAt.toISOString() : chapter.createdAt,
            authors: project.author?.name ? [project.author.name] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: images,
        },
    };
}

export default async function ReaderPage(props: ReaderPageProps) {
    const params = await props.params;
    const session = await auth();
    await dbConnect();

    const bookSlug = decodeURIComponent(params.bookSlug);
    const chapterSlug = decodeURIComponent(params.chapterSlug);

    const projectQuery = (bookSlug.match(/^[0-9a-fA-F]{24}$/))
        ? { _id: bookSlug }
        : { slug: bookSlug };

    const project = await WritingProject.findOne(projectQuery)
        .populate('author', 'name image username')
        .lean();

    if (!project) {
        return notFound();
    }

    const targetSlug = `${bookSlug}/${chapterSlug}`;
    const chapter = project.chapters.find((c: any) => c.slug === targetSlug || c.slug === chapterSlug);

    if (!chapter) {
        return notFound();
    }

    const authorId = project.author ? (project.author._id || project.author).toString() : undefined;
    const isAuthor = session?.user?.id === authorId;
    const isPublic = project.visibility === 'public' && chapter.status === 'published';

    if (!isPublic && !isAuthor) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Private Chapter</h1>
                <p className="text-muted-foreground">You do not have permission to read this chapter.</p>
                <Link href={`/books/${bookSlug}`} className="mt-4">
                    <Button variant="outline">Back to Book</Button>
                </Link>
            </div>
        );
    }

    const safeWordCount = Number.isFinite(Number(chapter.wordCount)) && Number(chapter.wordCount) > 0
        ? Number(chapter.wordCount)
        : 0;
    const readingMinutes = safeWordCount > 0
        ? Math.max(1, Math.ceil(safeWordCount / 200))
        : 0;
    const readingTimeLabel = readingMinutes > 0 ? `${readingMinutes} min` : "— min";

    return (
        <ReaderWrapper>
            {/* Main Layout Container */}
            <div className="max-w-[1920px] mx-auto min-h-screen">
                <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8">

                    {/* Left Sidebar (Desktop Only) */}
                    <div className="hidden lg:block lg:col-span-3 xl:col-span-2 relative">
                        <ReaderInfoSidebar project={project} />
                    </div>

                    {/* Center Content */}
                    <div className="lg:col-span-6 xl:col-span-8 px-4 py-8 md:py-12 max-w-3xl mx-auto w-full">
                        <div className="mb-8 flex items-center justify-between lg:hidden">
                            <Link
                                href={isAuthor ? `/writing/${bookSlug}` : `/books/${bookSlug}`}
                                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Link>
                        </div>

                        <div className="hidden lg:flex mb-8 items-center gap-4">
                            <Link
                                href={isAuthor ? `/writing/${bookSlug}` : `/books/${bookSlug}`}
                                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Book
                            </Link>
                            {isAuthor && (
                                <Link href={`/writing/${project.slug || project._id}/chapters/${chapter._id}/edit`}>
                                    <Button variant="outline" size="sm">Edit</Button>
                                </Link>
                            )}
                        </div>

                        <article className="prose prose-lg dark:prose-invert max-w-none mx-auto">
                            <header className="not-prose mb-8 md:mb-12 text-center border-b pb-8">
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
                                    <span className="flex items-center"><BookOpen className="mr-1 h-3 w-3" /> Chapter {chapter.chapterNumber}</span>
                                    <span>•</span>
                                    <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {formatDate(chapter.createdAt)}</span>
                                    <span>•</span>
                                    <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {readingTimeLabel}</span>
                                </div>

                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{chapter.title}</h1>

                                {chapter.image && (
                                    <div className="relative w-full aspect-[2/1] md:aspect-[3/1] mt-8 rounded-xl overflow-hidden shadow-lg">
                                        <Image
                                            src={chapter.image}
                                            alt={chapter.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </header>

                            <div className="font-serif text-lg md:text-xl leading-relaxed">
                                <ChapterContent content={chapter.content} />
                            </div>
                        </article>

                        {/* Mobile Navigation (Keep existing) */}
                        <div className="lg:hidden">
                            <ReaderNavigation
                                projectId={project._id.toString()}
                                projectSlug={bookSlug}
                                chapters={project.chapters.map((c: any) => ({
                                    ...c,
                                    _id: c._id.toString(),
                                    createdAt: c.createdAt?.toString(),
                                    updatedAt: c.updatedAt?.toString()
                                }))}
                                currentChapterId={chapter._id.toString()}
                            />
                        </div>
                    </div>

                    {/* Right Sidebar (Desktop Only) */}
                    <div className="hidden lg:block lg:col-span-3 xl:col-span-2 relative">
                        <ReaderChapterList
                            chapters={project.chapters.map((c: any) => ({
                                ...c,
                                _id: c._id.toString(),
                                createdAt: c.createdAt?.toString(),
                                updatedAt: c.updatedAt?.toString()
                            }))}
                            currentChapterId={chapter._id.toString()}
                            bookSlug={bookSlug}
                        />
                    </div>

                </main>
            </div>
        </ReaderWrapper>
    );
}
