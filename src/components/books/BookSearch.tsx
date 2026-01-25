'use client';

import { useState, useEffect } from 'react';
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
import Image from 'next/image';

interface Book {
    _id: string;
    title: string;
    author: string;
    coverImage?: string;
}

interface BookSearchProps {
    onSelect: (book: Book | null) => void;
    selectedBook: Book | null;
}

export function BookSearch({ onSelect, selectedBook }: BookSearchProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchBooks = async () => {
            if (!query && !open) return;

            setLoading(true);
            try {
                // Correct API endpoint uses 'q' for search query
                const res = await fetch(`/api/books?q=${query}&limit=20`);
                const data = await res.json();
                if (data.books) {
                    setBooks(data.books);
                }
            } catch (error) {
                console.error('Failed to search books', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchBooks, 300);
        return () => clearTimeout(debounce);
    }, [query, open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto py-3"
                >
                    {selectedBook ? (
                        <div className="flex items-center gap-3 text-left">
                            {selectedBook.coverImage ? (
                                <div className="h-10 w-8 relative flex-shrink-0">
                                    <Image src={selectedBook.coverImage} alt={selectedBook.title} fill className="object-cover rounded" />
                                </div>
                            ) : (
                                <div className="h-10 w-8 bg-muted rounded flex items-center justify-center text-xs">📚</div>
                            )}
                            <div>
                                <div className="font-medium line-clamp-1">{selectedBook.title}</div>
                                <div className="text-xs text-muted-foreground">{selectedBook.author}</div>
                            </div>
                        </div>
                    ) : (
                        "Select a book..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandPrimitive.Input
                            placeholder="Search books..."
                            value={query}
                            onValueChange={setQuery}
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 border border-primary text-primary rounded-full hover:bg-primary/10"
                            title="Add New Book"
                            onClick={() => {
                                window.location.href = "/books/add";
                            }}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No books found matching your search.
                            </div>
                        </CommandEmpty>
                        {loading ? (
                            <div className="p-4 flex justify-center text-sm text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        ) : (
                            <CommandGroup>
                                {books.map((book) => (
                                    <CommandItem
                                        key={book._id}
                                        value={book._id}
                                        onSelect={() => {
                                            if (selectedBook?._id === book._id) {
                                                onSelect(null);
                                            } else {
                                                onSelect(book);
                                            }
                                            setOpen(false);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedBook?._id === book._id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center gap-3">
                                            {book.coverImage ? (
                                                <div className="h-10 w-8 relative flex-shrink-0">
                                                    <Image src={book.coverImage} alt={book.title} fill className="object-cover rounded" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-8 bg-muted rounded flex items-center justify-center text-xs">📚</div>
                                            )}
                                            <div>
                                                <div className="font-medium">{book.title}</div>
                                                <div className="text-xs text-muted-foreground">{book.author}</div>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
