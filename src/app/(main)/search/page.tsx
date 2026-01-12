'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Users, FileText, BookOpen, Users2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface SearchResults {
    users?: any[];
    posts?: any[];
    books?: any[];
    teams?: any[];
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [searchInput, setSearchInput] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState('all');
    const [results, setResults] = useState<SearchResults>({});
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery, 'all');
        }
    }, [initialQuery]);

    const performSearch = async (searchQuery: string, type: string = 'all') => {
        if (!searchQuery || searchQuery.trim().length < 2) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}`);
            const data = await response.json();

            if (data.results) {
                setResults(data.results);
                setTotalResults(data.totalResults);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setQuery(searchInput);
            performSearch(searchInput, activeTab);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (query) {
            performSearch(query, tab);
        }
    };

    const tabs = [
        { id: 'all', label: 'All', icon: Search },
        { id: 'users', label: 'Users', icon: Users, count: results.users?.length || 0 },
        { id: 'posts', label: 'Posts', icon: FileText, count: results.posts?.length || 0 },
        { id: 'books', label: 'Books', icon: BookOpen, count: results.books?.length || 0 },
        { id: 'teams', label: 'Teams', icon: Users2, count: results.teams?.length || 0 },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4">
            {/* Search Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">Search</h1>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search for users, posts, books, teams..."
                            className="pl-10 h-12 text-base"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" size="lg">
                        Search
                    </Button>
                </form>

                {query && (
                    <p className="text-sm text-muted-foreground mt-2">
                        {totalResults} results for "{query}"
                    </p>
                )}
            </div>

            {/* Tabs */}
            {query && (
                <div className="border-b mb-6">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                                        ? 'text-primary border-primary'
                                        : 'text-muted-foreground border-transparent hover:text-foreground'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                                {tab.id !== 'all' && tab.count > 0 && (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Searching...
                </div>
            ) : !query ? (
                <div className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Search Pathchakro</h3>
                    <p className="text-muted-foreground">
                        Find users, posts, books, and teams
                    </p>
                </div>
            ) : totalResults === 0 ? (
                <div className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground">
                        Try different keywords or check your spelling
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Users */}
                    {(activeTab === 'all' || activeTab === 'users') && results.users && results.users.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-3">Users</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.users.map((user: any) => (
                                    <Link
                                        key={user._id}
                                        href={`/profile/${user.name}`}
                                        className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                                {user.name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{user.name}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {user.university || user.thana || user.rankTier}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Posts */}
                    {(activeTab === 'all' || activeTab === 'posts') && results.posts && results.posts.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-3">Posts</h2>
                            <div className="space-y-3">
                                {results.posts.map((post: any) => (
                                    <div key={post._id} className="bg-card border rounded-lg p-4">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                                                {post.author.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{post.author.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(post.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm line-clamp-3">{post.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Books */}
                    {(activeTab === 'all' || activeTab === 'books') && results.books && results.books.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-3">Books</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {results.books.map((book: any) => (
                                    <div key={book._id} className="bg-card border rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <div className="w-16 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm line-clamp-2">{book.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
                                                {book.averageRating > 0 && (
                                                    <p className="text-xs text-yellow-600 mt-1">
                                                        ⭐ {book.averageRating.toFixed(1)} ({book.totalReviews} reviews)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Teams */}
                    {(activeTab === 'all' || activeTab === 'teams') && results.teams && results.teams.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-3">Teams</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.teams.map((team: any) => (
                                    <Link
                                        key={team._id}
                                        href={`/teams/${team._id}`}
                                        className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                <Users2 className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{team.name}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                    {team.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {team.members.length} members • {team.type}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
