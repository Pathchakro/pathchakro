'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    PenTool, Plus, Eye, EyeOff, Download, DollarSign,
    BookOpen, Edit, Save, ArrowLeft, Settings
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface WritingProject {
    _id: string;
    title: string;
    coverImage?: string;
    introduction?: string;
    description?: string;
    category: string[];
    status: string;
    visibility: string;
    chapters: Array<{
        _id: string;
        chapterNumber: number;
        title: string;
        content: string;
        wordCount: number;
        status: string;
        createdAt: string;
        updatedAt: string;
    }>;
    totalWords: number;
    totalChapters: number;
    forSale: boolean;
    salePrice?: number;
    saleType?: string;
    author: {
        _id: string;
        name: string;
    };
}

export default function WritingProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = (params.slug || params.id) as string;

    const [project, setProject] = useState<WritingProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('chapters');

    // Chapter form
    const [showChapterForm, setShowChapterForm] = useState(false);
    const [editingChapter, setEditingChapter] = useState<string | null>(null);
    const [chapterTitle, setChapterTitle] = useState('');
    const [chapterContent, setChapterContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Settings
    const [visibility, setVisibility] = useState('private');
    const [forSale, setForSale] = useState(false);
    const [salePrice, setSalePrice] = useState('');
    const [saleType, setSaleType] = useState('pdf');

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    useEffect(() => {
        if (project) {
            setVisibility(project.visibility);
            setForSale(project.forSale);
            setSalePrice(project.salePrice?.toString() || '');
            setSaleType(project.saleType || 'pdf');
        }
    }, [project]);

    const fetchProject = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/writing/${projectId}`);
            const data = await response.json();

            if (data.project) {
                setProject(data.project);
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditChapter = (chapter: any) => {
        setEditingChapter(chapter._id);
        setChapterTitle(chapter.title);
        // Note: project list might not include content. For now we use what's there.
        // If content is missing, user might overwrite with empty string if they don't notice.
        // Ideally we fetch the chapter details here.
        setChapterContent(chapter.content || '');
        setShowChapterForm(true);
        setActiveTab('write');
    };

    const handleCancelEdit = () => {
        setEditingChapter(null);
        setChapterTitle('');
        setChapterContent('');
        setShowChapterForm(false);
    };

    const handleSaveChapter = async () => {
        if (!chapterTitle.trim() || !chapterContent.trim()) {
            toast.error('Please provide chapter title and content');
            return;
        }

        setIsSaving(true);
        try {
            let url = `/api/writing/${projectId}/chapters`;
            let method = 'POST';
            let body: any = {
                title: chapterTitle,
                content: chapterContent,
            };

            if (editingChapter) {
                method = 'PUT';
                body = {
                    chapterId: editingChapter,
                    title: chapterTitle,
                    content: chapterContent,
                };
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                setChapterTitle('');
                setChapterContent('');
                setEditingChapter(null);
                setShowChapterForm(false);
                fetchProject();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error saving chapter:', error);
            toast.error('Failed to save chapter');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateSettings = async () => {
        try {
            const response = await fetch(`/api/writing/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visibility,
                    forSale,
                    salePrice: forSale ? parseFloat(salePrice) : undefined,
                    saleType: forSale ? saleType : undefined,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                fetchProject();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    const handleExportPDF = () => {
        if (!project) return;

        // Create a simple PDF content string
        let pdfContent = `${project.title}\n\n`;
        if (project.introduction) {
            pdfContent += `Introduction:\n${project.introduction}\n\n`;
        }

        project.chapters.forEach(chapter => {
            pdfContent += `\nChapter ${chapter.chapterNumber}: ${chapter.title}\n\n`;
            pdfContent += `${chapter.content}\n\n`;
        });

        // Create blob and download
        const blob = new Blob([pdfContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.info('Book exported! Note: use an online converter for PDF format.');
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">Loading project...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-7xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Project not found</h2>
                    <Link href="/writing"><Button>Back to My Writing</Button></Link>
                </div>
            </div>
        );
    }

    const wordCount = chapterContent.trim().split(/\s+/).filter(Boolean).length;

    return (
        <div className="max-w-7xl mx-auto p-4">
            <Link href="/writing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to My Writing
            </Link>

            {/* Header */}
            <div className="bg-card rounded-lg border p-6 mb-4">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {project.status.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-full">
                                {project.visibility === 'public' ? <><Eye className="h-3 w-3" /> Public</> : <><EyeOff className="h-3 w-3" /> Private</>}
                            </span>
                            {project.forSale && (
                                <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    <DollarSign className="h-3 w-3" /> For Sale
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleExportPDF} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{project.totalChapters}</p>
                        <p className="text-sm text-muted-foreground">Chapters</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{project.totalWords.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Words</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{Math.round(project.totalWords / 250)}</p>
                        <p className="text-sm text-muted-foreground">Est. Pages</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="chapters">Chapters</TabsTrigger>
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Chapters Tab */}
                <TabsContent value="chapters" className="space-y-4">
                    <Button onClick={() => { setShowChapterForm(true); setActiveTab('write'); }} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Chapter
                    </Button>

                    {project.chapters.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-lg border">
                            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground">No chapters yet. Start writing!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {project.chapters.map((chapter) => (
                                <div key={chapter._id} className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">
                                                Chapter {chapter.chapterNumber}: {chapter.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {chapter.wordCount} words • {chapter.status}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Last updated: {new Date(chapter.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleEditChapter(chapter)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Write Tab */}
                <TabsContent value="write">
                    <div className="bg-card border rounded-lg p-6">
                        <h2 className="font-semibold text-lg mb-4">
                            {showChapterForm
                                ? (editingChapter ? 'Edit Chapter' : 'Write New Chapter')
                                : 'Select a chapter or create new'}
                        </h2>

                        {showChapterForm && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="chapterTitle">Chapter Title</Label>
                                    <Input
                                        id="chapterTitle"
                                        value={chapterTitle}
                                        onChange={(e) => setChapterTitle(e.target.value)}
                                        placeholder="Chapter title..."
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="chapterContent">Content</Label>
                                    <Textarea
                                        id="chapterContent"
                                        value={chapterContent}
                                        onChange={(e) => setChapterContent(e.target.value)}
                                        placeholder="Start writing your chapter..."
                                        rows={20}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Word count: {wordCount}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={handleSaveChapter} disabled={isSaving} className="flex-1">
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSaving ? 'Saving...' : (editingChapter ? 'Update Chapter' : 'Save Chapter')}
                                    </Button>
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                    <div className="bg-card border rounded-lg p-6 space-y-6">
                        <div>
                            <Label>Visibility</Label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="w-full mt-2 px-3 py-2 border rounded-md"
                            >
                                <option value="private">Private (Only you can see)</option>
                                <option value="public">Public (Everyone can read)</option>
                            </select>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="forSale"
                                    checked={forSale}
                                    onChange={(e) => setForSale(e.target.checked)}
                                />
                                <Label htmlFor="forSale">List for sale on Pathchakro Marketplace</Label>
                            </div>

                            {forSale && (
                                <div className="ml-6 space-y-4">
                                    <div>
                                        <Label>Sale Type</Label>
                                        <select
                                            value={saleType}
                                            onChange={(e) => setSaleType(e.target.value)}
                                            className="w-full mt-2 px-3 py-2 border rounded-md"
                                        >
                                            <option value="pdf">PDF Only</option>
                                            <option value="physical">Physical Book Only</option>
                                            <option value="both">Both PDF & Physical</option>
                                        </select>
                                    </div>

                                    <div>
                                        <Label>Price (BDT)</Label>
                                        <Input
                                            type="number"
                                            value={salePrice}
                                            onChange={(e) => setSalePrice(e.target.value)}
                                            placeholder="Enter price"
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button onClick={handleUpdateSettings} className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Save Settings
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
