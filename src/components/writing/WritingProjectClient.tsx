'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Trash2, Edit, Download, BookOpen, MoreVertical, Eye, DollarSign, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { BookCover } from '@/components/books/BookCover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { SortableChapterList } from '@/app/(main)/writing/[slug]/SortableChapterList';
import { Select } from '@/components/ui/select';

interface WritingProject {
    _id: string;
    title: string;
    description?: string;
    coverImage?: string;
    slug: string;
    visibility: 'public' | 'private' | 'unlisted';
    forSale: boolean;
    salePrice?: number;
    totalWords?: number;
    chapters: any[];
}

export default function WritingProjectClient({ initialProject }: { initialProject: WritingProject }) {
    const router = useRouter();
    const [project, setProject] = useState(initialProject);
    const [activeTab, setActiveTab] = useState('chapters');

    const [showEditProjectDialog, setShowEditProjectDialog] = useState(false);
    const [editTitle, setEditTitle] = useState(project.title);
    const [editCoverImage, setEditCoverImage] = useState(project.coverImage || '');
    const [editDescription, setEditDescription] = useState(project.description || '');
    const [editSlug, setEditSlug] = useState(project.slug || '');

    const [visibility, setVisibility] = useState(project.visibility);
    const [forSale, setForSale] = useState(project.forSale);
    const [salePrice, setSalePrice] = useState(project.salePrice?.toString() || '');
    
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const handleSaveDetails = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/writing/${project._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDescription,
                    coverImage: editCoverImage,
                    slug: editSlug
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Project details updated');
                setProject(prev => ({ ...prev, ...data.project }));
                setShowEditProjectDialog(false);
                router.refresh();
            } else {
                toast.error(data.message || 'Failed to update details');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Something went wrong while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        if (isSavingSettings) return;
        setIsSavingSettings(true);
        try {
            const res = await fetch(`/api/writing/${project._id}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibility, forSale, salePrice: parseFloat(salePrice) || 0 }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Settings updated successfully');
                router.refresh();
            } else {
                toast.error(data.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Settings error:', error);
            toast.error('Network error while saving settings');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Project?',
            text: 'This will delete all chapters and content. This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/writing/${project._id}`, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                    toast.success('Project deleted');
                    router.push('/writing');
                } else {
                    toast.error(data.message || 'Failed to delete project');
                }
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('An error occurred while deleting');
            }
        }
    };

    const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Delete Chapter?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/writing/${project.slug}/chapters/${chapterId}`, { method: 'DELETE' });
                if (res.ok) {
                    toast.success('Chapter deleted');
                    setProject(prev => ({
                        ...prev,
                        chapters: prev.chapters.filter(c => c._id !== chapterId)
                    }));
                    router.refresh();
                } else {
                    const data = await res.json();
                    toast.error(data.message || 'Failed to delete chapter');
                }
            } catch (error) {
                console.error('Delete chapter error:', error);
                toast.error('An error occurred while deleting chapter');
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/writing')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
            </div>

            <div className="bg-card border-2 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-48 h-72 shrink-0 relative overflow-hidden rounded-2xl border-2">
                        <BookCover alt={project.title} src={project.coverImage} />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black mb-2">{project.title}</h1>
                                <p className="text-muted-foreground">{project.description || 'No description provided.'}</p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-5 w-5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => setShowEditProjectDialog(true)} className="gap-2"><Edit className="h-4 w-4" /> Edit Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleDelete} className="text-red-500 gap-2"><Trash2 className="h-4 w-4" /> Delete Project</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                            <div className="p-4 bg-muted/50 rounded-2xl">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Words</p>
                                <p className="text-2xl font-bold">{(project.totalWords ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-2xl">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Chapters</p>
                                <p className="text-2xl font-bold">{project.chapters.length}</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-2xl">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Status</p>
                                <div className="flex items-center gap-1">
                                    {project.visibility === 'public' ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-amber-500" />}
                                    <span className="font-bold capitalize">{project.visibility}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-2xl">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Sales</p>
                                <p className="text-2xl font-bold">{project.forSale ? `৳${project.salePrice}` : 'Free'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted p-1 rounded-2xl mb-6">
                    <TabsTrigger value="chapters" className="rounded-xl font-bold gap-2"><BookOpen className="h-4 w-4" /> Chapters</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-xl font-bold gap-2"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="chapters" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black">Manage Chapters</h2>
                        <Button onClick={() => router.push(`/writing/${project.slug}/new-chapter`)} className="rounded-xl font-bold gap-2">
                            <Plus className="h-4 w-4" /> New Chapter
                        </Button>
                    </div>
                    <div className="bg-card border-2 rounded-3xl overflow-hidden p-6">
                        <SortableChapterList 
                            projectSlug={project.slug} 
                            projectId={project._id}
                            chapters={project.chapters} 
                            onDelete={handleDeleteChapter}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    <div className="max-w-2xl bg-card border-2 rounded-3xl p-8 space-y-8">
                        <h2 className="text-2xl font-black">Project Settings</h2>
                        
                        <div className="space-y-4">
                            <Label className="font-bold">Visibility</Label>
                            <Select value={visibility} onChange={(e: any) => setVisibility(e.target.value)}>
                                <option value="public">Public - Anyone can read</option>
                                <option value="private">Private - Only you can see</option>
                                <option value="unlisted">Unlisted - Only people with link</option>
                            </Select>
                            <p className="text-xs text-muted-foreground font-medium">Control who can access your writing project.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                            <div className="space-y-1">
                                <Label className="font-bold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Enable Sales</Label>
                                <p className="text-xs text-muted-foreground font-medium">Allow readers to purchase your book.</p>
                            </div>
                            <input type="checkbox" checked={forSale} onChange={(e) => setForSale(e.target.checked)} className="h-6 w-6 accent-primary" />
                        </div>

                        {forSale && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label className="font-bold">Sale Price (BDT)</Label>
                                <Input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" className="rounded-xl font-bold" />
                            </div>
                        )}

                        <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full rounded-xl font-bold py-6">
                            {isSavingSettings ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={showEditProjectDialog} onOpenChange={setShowEditProjectDialog}>
                <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader><DialogTitle className="text-2xl font-black">Edit Project Details</DialogTitle></DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <ImageUploader 
                                    currentImage={editCoverImage} 
                                    onUpload={setEditCoverImage} 
                                    variant="cover"
                                />
                            </div>
                            <div className="col-span-2 space-y-4">
                                <div className="space-y-2"><Label className="font-bold">Project Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="rounded-xl font-bold" /></div>
                                <div className="space-y-2"><Label className="font-bold">URL Slug</Label><Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="rounded-xl" /></div>
                            </div>
                        </div>
                        <div className="space-y-2"><Label className="font-bold">Description</Label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} className="rounded-xl" /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setShowEditProjectDialog(false)} className="rounded-xl font-bold">Cancel</Button><Button onClick={handleSaveDetails} disabled={isSaving} className="rounded-xl font-bold">{isSaving ? 'Saving...' : 'Save Changes'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
