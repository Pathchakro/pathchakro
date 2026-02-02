'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenTool, Plus, Settings, Trash2, Edit, Save, Download, BookOpen, MoreVertical, Eye, DollarSign, EyeOff, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { BookCover } from '@/components/books/BookCover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { SortableChapterList } from './SortableChapterList';

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
        slug?: string;
        createdAt: string;
        updatedAt: string;
    }>;
    totalWords: number;
    totalChapters: number;
    forSale: boolean;
    salePrice?: number;
    saleType?: string;
    slug?: string;
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

    const handleAddNewChapter = () => {
        setEditingChapter(null);
        setChapterTitle('');
        setChapterContent('');
        // console.log('Starting add chapter flow');
        setShowChapterForm(true);
        setActiveTab('write');
        setTimeout(() => {
            const tabs = document.getElementById('writing-tabs-wrapper');
            if (tabs) {
                // console.log('Scrolling to tabs');
                tabs.scrollIntoView({ behavior: 'smooth' });
            } else {
                // console.error('Tabs wrapper not found');
            }
        }, 100);
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

    // Project Editing
    const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editCoverImage, setEditCoverImage] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Initialize edit fields when project loads
    useEffect(() => {
        if (project) {
            setEditTitle(project.title);
            setEditCoverImage(project.coverImage || '');
            setEditDescription(project.description || '');
        }
    }, [project]);

    const handleSaveProjectDetails = async () => {
        try {
            const response = await fetch(`/api/writing/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle,
                    coverImage: editCoverImage,
                    description: editDescription,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Project details updated');
                setShowEditProjectDialog(false);
                fetchProject();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error('Failed to update project');
        }
    };

    const handleDeleteChapter = async (chapterId: string) => {
        if (!window.confirm('Are you sure you want to delete this chapter?')) return;

        try {
            const response = await fetch(`/api/writing/${projectId}/chapters`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterId }),
            });

            if (response.ok) {
                toast.success('Chapter deleted');
                fetchProject();
            } else {
                toast.error('Failed to delete chapter');
            }
        } catch (error) {
            console.error('Error deleting chapter:', error);
            toast.error('Failed to delete chapter');
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

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

        try {
            const response = await fetch(`/api/writing/${project?._id}`, { method: 'DELETE' });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete');
            }

            toast.success('Project deleted');
            router.push('/writing');
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project');
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
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Cover Image */}
                    <div className="w-32 shrink-0">
                        <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-md bg-muted">
                            <BookCover src={project.coverImage} alt={project.title} />
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                                <div className="flex items-center gap-2 mb-2">
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
                                <Link href={`/writing/${project.slug || project._id}/chapters/new`}>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Chapter
                                    </Button>
                                </Link>
                                <Button onClick={handleExportPDF} variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setShowEditProjectDialog(true)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={handleDeleteProject}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Project
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Project Details</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Title</Label>                                                <Input
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    placeholder="Book Title"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Cover Image</Label>
                                                <div className="flex justify-center">
                                                    <ImageUploader
                                                        onUpload={setEditCoverImage}
                                                        currentImage={editCoverImage}
                                                        variant="cover"
                                                        className="w-32 aspect-[2/3]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    placeholder="Book Description"
                                                    rows={4}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowEditProjectDialog(false)}>Cancel</Button>
                                            <Button onClick={handleSaveProjectDetails}>Save Changes</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
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
                </div>
            </div>

            {/* Tabs */}
            <div id="writing-tabs-wrapper">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                        <TabsTrigger value="chapters">Chapters</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chapters" className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Chapters ({project.chapters.length})</h2>
                        </div>

                        {project.chapters.length === 0 ? (
                            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-lg font-medium mb-1">No chapters yet</h3>
                                <p className="text-muted-foreground mb-4">Start writing your first chapter!</p>
                                <Link href={`/writing/${project.slug || project._id}/chapters/new`}>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Start Writing
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <SortableChapterList
                                chapters={project.chapters}
                                projectId={project._id}
                                projectSlug={project.slug || project._id}
                                onDelete={handleDeleteChapter}
                            />
                        )}
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

                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-red-600 font-semibold mb-2">Danger Zone</h3>
                                <p className="text-sm text-muted-foreground mb-4">Deleting a project is permanent and cannot be undone.</p>
                                <Button variant="destructive" className="w-full" onClick={handleDeleteProject}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Project
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
