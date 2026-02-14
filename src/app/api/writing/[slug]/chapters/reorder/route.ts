import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import WritingProject from '@/models/WritingProject';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ slug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        let input;
        try {
            input = await request.json();
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const chapterIds = input.chapterIds;

        if (!Array.isArray(chapterIds) || !chapterIds.every((id: any) => typeof id === 'string')) {
            return NextResponse.json(
                { error: 'Invalid input: chapterIds must be an array of strings' },
                { status: 422 }
            );
        }

        if (new Set(chapterIds).size !== chapterIds.length) {
            return NextResponse.json(
                { error: 'Invalid input: duplicate chapterIds are not allowed' },
                { status: 422 }
            );
        }

        // params.slug is project ID or slug
        const projectIdOrSlug = params.slug;

        await dbConnect();

        // Find project
        const query = (projectIdOrSlug.match(/^[0-9a-fA-F]{24}$/))
            ? { _id: projectIdOrSlug }
            : { slug: projectIdOrSlug };

        const project = await WritingProject.findOne(query);

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        if (project.author.toString() !== session.user.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }
        // Reorder logic
        // We have an array of chapter objects in `project.chapters`.
        // We received `chapterIds` in the desired order.

        // Create a map for quick lookup
        const chapterMap = new Map<string, any>(project.chapters.map((c: any) => [c._id.toString(), c]));

        const newChapters = [];


        const missingIds = [];


        for (let i = 0; i < chapterIds.length; i++) {
            const id = chapterIds[i];
            const chapter = chapterMap.get(id);
            if (chapter) {
                chapter.chapterNumber = i + 1;
                newChapters.push(chapter);
                chapterMap.delete(id); // Remove found to track orphans?
            } else {
                missingIds.push(id);
            }
        }

        if (missingIds.length > 0) {
            return NextResponse.json(
                { error: 'Invalid chapter IDs provided', missingIds },
                { status: 400 }
            );
        }

        // If there are chapters NOT in the dragged list (orphan), append them at the end?
        // Or assume the list is complete. We should probably just safe guard.
        if (chapterMap.size > 0) {
            // Append remaining chapters
            let index = newChapters.length;
            for (const [id, chapter] of chapterMap) {
                chapter.chapterNumber = index + 1;
                newChapters.push(chapter);
                index++;
            }
        }

        project.chapters = newChapters;

        // Also update totalChapters just in case? (Should be same)
        project.totalChapters = newChapters.length;

        await project.save();

        return NextResponse.json({ success: true, chapters: newChapters });

    } catch (error) {
        console.error('Error reordering chapters:', error);
        return NextResponse.json(
            { error: 'Failed to reorder chapters' },
            { status: 500 }
        );
    }
}
