import { getCachedWritingProject } from '@/lib/data/writing';
import WritingProjectClient from '@/components/writing/WritingProjectClient';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const project = await getCachedWritingProject(params.slug);
    if (!project) return { title: 'Project Not Found' };

    return {
        title: `${project.title} | Writing - Pathchakro`,
        description: project.description || `Writing project: ${project.title}`,
    };
}

export default async function WritingProjectPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    
    // Direct database call with unstable_cache
    const project = await getCachedWritingProject(params.slug);

    if (!project) {
        notFound();
    }

    return <WritingProjectClient initialProject={project} />;
}
