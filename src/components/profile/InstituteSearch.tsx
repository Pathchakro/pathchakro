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
import { AddInstituteDialog } from './AddInstituteDialog';

interface Institute {
    _id: string;
    name: string;
}

interface InstituteSearchProps {
    value?: string;
    onSelect: (name: string) => void;
}

export function InstituteSearch({ value, onSelect }: InstituteSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [institutes, setInstitutes] = useState<Institute[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);

    useEffect(() => {
        // Reset when query changes
        setPage(1);
        setHasMore(true);
        setInstitutes([]);
    }, [query]);

    useEffect(() => {
        const fetchInstitutes = async () => {
            if (!hasMore && page > 1) return;

            setLoading(true);
            try {
                const limit = 20;
                const res = await fetch(`/api/institutes?q=${query}&limit=${limit}&page=${page}`);
                const data = await res.json();

                if (data.institutes) {
                    if (data.institutes.length < limit) {
                        setHasMore(false);
                    }

                    setInstitutes(prev => page === 1 ? data.institutes : [...prev, ...data.institutes]);
                }
            } catch (error) {
                console.error('Failed to fetch institutes', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchInstitutes, 300);
        return () => clearTimeout(debounce);
    }, [query, page]);

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 20) {
            if (hasMore && !loading) {
                setPage((prev) => prev + 1);
            }
        }
    };

    const handleAddSuccess = (newInstitute: any) => {
        onSelect(newInstitute.name);
        setInstitutes(prev => [newInstitute, ...prev]);
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
                        className="w-full justify-between font-normal"
                    >
                        {value ? value : "Select institution..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start" side="bottom" avoidCollisions={false}>
                    <Command shouldFilter={false}>
                        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandPrimitive.Input
                                placeholder="Search institution..."
                                value={query}
                                onValueChange={setQuery}
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 border border-primary text-primary rounded-full hover:bg-primary/10 ml-2"
                                title="Add New Institute"
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
                            <CommandEmpty>No institution found.</CommandEmpty>
                            <CommandGroup>
                                {institutes.map((inst) => (
                                    <CommandItem
                                        key={inst._id}
                                        value={inst.name}
                                        onSelect={() => {
                                            onSelect(inst.name === value ? "" : inst.name);
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === inst.name ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {inst.name}
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

            <AddInstituteDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSuccess={handleAddSuccess}
                initialName={query}
            />
        </>
    );
}
