'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Loader2, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command as CommandPrimitive } from 'cmdk';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { AddAuthorDialog } from './AddAuthorDialog';

interface Author {
    _id: string;
    name: string;
}

interface AuthorSearchProps {
    value?: string; // Author name
    onSelect: (name: string) => void;
}

export function AuthorSearch({ value, onSelect }: AuthorSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Dialog state
    const [showAddDialog, setShowAddDialog] = useState(false);

    // Observer for infinite scroll
    const observerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // Reset when query changes
        setPage(1);
        setHasMore(true);
        setAuthors([]);
    }, [query]);

    useEffect(() => {
        const fetchAuthors = async () => {
            if (!hasMore && page > 1) return;

            setLoading(true);
            try {
                const limit = 20;
                const res = await fetch(`/api/authors?q=${query}&limit=${limit}&page=${page}`);
                const data = await res.json();

                if (data.authors) {
                    if (data.authors.length < limit) {
                        setHasMore(false);
                    }

                    setAuthors(prev => page === 1 ? data.authors : [...prev, ...data.authors]);
                }
            } catch (error) {
                console.error('Failed to fetch authors', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchAuthors, 300);
        return () => clearTimeout(debounce);
    }, [query, page]); // Removed hasMore dep to avoid loops, handled inside

    // Removed IO for simplicity and reliability in Popover
    // useEffect for IO matched here

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 20) {
            if (hasMore && !loading) {
                setPage((prev) => prev + 1);
            }
        }
    };

    const handleAddSuccess = (newAuthor: any) => {
        onSelect(newAuthor.name);
        setAuthors(prev => [newAuthor, ...prev]);
        setOpen(false);
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value ? value : "Select author..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start" side="bottom" avoidCollisions={false}>
                    <Command shouldFilter={false}>
                        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandPrimitive.Input
                                placeholder="Search author..."
                                value={query}
                                onValueChange={setQuery}
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 border border-primary text-primary rounded-full hover:bg-primary/10 ml-2"
                                title="Add New Author"
                                onClick={() => {
                                    setShowAddDialog(true);
                                    setOpen(false);
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <CommandList
                            className="max-h-[200px] overflow-y-auto"
                            onScroll={onScroll}
                        >
                            <CommandEmpty>No author found.</CommandEmpty>
                            <CommandGroup>
                                {authors.map((author) => (
                                    <CommandItem
                                        key={author._id}
                                        value={author.name}
                                        onSelect={() => {
                                            onSelect(author.name === value ? "" : author.name);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === author.name ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {author.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {/* Loading / Click Trigger */}
                            <div
                                className="p-2 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted"
                                onClick={() => {
                                    if (hasMore && !loading) setPage(p => p + 1);
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                                    </span>
                                ) : hasMore ? (
                                    <span>Scroll or click for more</span>
                                ) : (
                                    <span>End of results</span>
                                )}
                            </div>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <AddAuthorDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSuccess={handleAddSuccess}
                initialName={query}
            />
        </>
    );
}
