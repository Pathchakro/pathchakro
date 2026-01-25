'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Facebook, Linkedin, Twitter, MessageCircle, Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareDialogProps {
    post: {
        _id: string;
        title?: string;
        slug?: string;
        content: string;
    };
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ShareDialog({ post, trigger, isOpen, onOpenChange }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);

    // Construct URL
    // We access window in effect or handler, but here we can just assume base path if simpler, 
    // or use window.location.origin inside event handlers to avoid SSR issues
    const getShareUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/posts/${post.slug || post._id}`;
        }
        return `https://pathchakro.com/posts/${post.slug || post._id}`; // Fallback/Demo URL
    };

    const handleCopy = () => {
        const url = getShareUrl();
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSocialShare = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp') => {
        const url = encodeURIComponent(getShareUrl());
        const text = encodeURIComponent(`Check out this post: ${post.title || 'Pathchakro Post'}`);

        let shareLink = '';

        switch (platform) {
            case 'facebook':
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
                break;
            case 'twitter':
                shareLink = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'linkedin':
                shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'whatsapp':
                shareLink = `https://wa.me/?text=${text}%20${url}`;
                break;
        }

        window.open(shareLink, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Post</DialogTitle>
                    <DialogDescription>
                        Share this post with your friends and network.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 py-4">
                    <div className="grid flex-1 gap-2">
                        <Input
                            id="link"
                            defaultValue={getShareUrl()}
                            readOnly
                            className="h-9"
                        />
                    </div>
                    <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
                        {copied ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                        <span className="sr-only">Copy</span>
                    </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" className="flex flex-col h-20 gap-2 hover:bg-blue-50 hover:text-blue-600 border-dashed" onClick={() => handleSocialShare('facebook')}>
                        <Facebook className="h-6 w-6 text-blue-600" />
                        <span className="text-xs">Facebook</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-20 gap-2 hover:bg-sky-50 hover:text-sky-500 border-dashed" onClick={() => handleSocialShare('twitter')}>
                        <Twitter className="h-6 w-6 text-sky-500" />
                        <span className="text-xs">Twitter</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-20 gap-2 hover:bg-blue-50 hover:text-blue-700 border-dashed" onClick={() => handleSocialShare('linkedin')}>
                        <Linkedin className="h-6 w-6 text-blue-700" />
                        <span className="text-xs">LinkedIn</span>
                    </Button>
                    <Button variant="outline" className="flex flex-col h-20 gap-2 hover:bg-green-50 hover:text-green-600 border-dashed" onClick={() => handleSocialShare('whatsapp')}>
                        <MessageCircle className="h-6 w-6 text-green-600" />
                        <span className="text-xs">WhatsApp</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
