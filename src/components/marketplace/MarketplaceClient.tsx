'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ShoppingBag, Plus, Search, MapPin, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

interface Product {
    _id: string;
    seller: {
        _id: string;
        name: string;
        image?: string;
    };
    title: string;
    description: string;
    category: string;
    price: number;
    originalPrice?: number;
    images: string[];
    stock: number;
    condition: string;
    location: string;
    views: number;
}

export default function MarketplaceClient({ initialProducts }: { initialProducts: Product[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
    const [conditionFilter, setConditionFilter] = useState(searchParams.get('condition') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [priceError, setPriceError] = useState<string | null>(null);

    const handleFilterChange = useCallback(() => {
        // Validate prices
        if (minPrice && maxPrice && parseInt(minPrice) > parseInt(maxPrice)) {
            setPriceError('Min price cannot be higher than max price');
            return;
        }
        setPriceError(null);

        const params = new URLSearchParams(searchParams.toString());
        if (categoryFilter) params.set('category', categoryFilter); else params.delete('category');
        if (conditionFilter) params.set('condition', conditionFilter); else params.delete('condition');
        if (searchQuery) params.set('search', searchQuery); else params.delete('search');
        if (minPrice) params.set('minPrice', minPrice); else params.delete('minPrice');
        if (maxPrice) params.set('maxPrice', maxPrice); else params.delete('maxPrice');
        
        // Use replace to avoid history bloat
        router.replace(`/marketplace?${params.toString()}`);
    }, [categoryFilter, conditionFilter, searchQuery, minPrice, maxPrice, searchParams, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange();
        }, 500);
        return () => clearTimeout(timer);
    }, [handleFilterChange]);

    const handlePriceInput = (value: string, setter: (val: string) => void) => {
        // Only allow positive numbers or empty string
        if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
            setter(value);
        }
    };

    const getDiscountPercentage = (price: number, originalPrice?: number) => {
        if (!originalPrice || originalPrice <= price) return null;
        return Math.round(((originalPrice - price) / originalPrice) * 100);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 pb-20">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Marketplace</h1>
                        <p className="text-muted-foreground font-medium mt-1">Discover pre-owned and new academic resources at great prices.</p>
                    </div>
                    <Link href="/marketplace/sell">
                        <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2">
                            <Plus className="h-5 w-5" /> Sell Item
                        </Button>
                    </Link>
                </div>

                <div className="bg-card border-2 p-6 rounded-[2rem] shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                placeholder="What are you looking for?" 
                                className="pl-12 h-12 bg-muted/30 border-0 rounded-2xl font-medium focus:ring-2 focus:ring-primary/20 transition-all" 
                            />
                        </div>
                        <Select 
                            value={categoryFilter} 
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
                            className="h-12 bg-muted/30 border-0 rounded-2xl font-bold"
                        >
                            <option value="">All Categories</option>
                            <option value="book">Books</option>
                            <option value="notebook">Notebooks</option>
                            <option value="pen">Pens</option>
                            <option value="calculator">Calculators</option>
                            <option value="bag">Bags</option>
                            <option value="other">Other</option>
                        </Select>
                        <Select 
                            value={conditionFilter} 
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setConditionFilter(e.target.value)}
                            className="h-12 bg-muted/30 border-0 rounded-2xl font-bold"
                        >
                            <option value="">All Conditions</option>
                            <option value="new">New</option>
                            <option value="used">Used</option>
                            <option value="refurbished">Refurbished</option>
                        </Select>
                        <div className="flex gap-2">
                            <Input 
                                type="number" 
                                value={minPrice} 
                                onChange={(e) => handlePriceInput(e.target.value, setMinPrice)} 
                                placeholder="Min ৳" 
                                className="h-12 bg-muted/30 border-0 rounded-2xl font-bold text-center" 
                            />
                            <Input 
                                type="number" 
                                value={maxPrice} 
                                onChange={(e) => handlePriceInput(e.target.value, setMaxPrice)} 
                                placeholder="Max ৳" 
                                className="h-12 bg-muted/30 border-0 rounded-2xl font-bold text-center" 
                            />
                        </div>
                    </div>
                    {priceError && (
                        <div className="flex items-center gap-2 text-destructive text-sm font-bold bg-destructive/5 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4" />
                            {priceError}
                        </div>
                    )}
                </div>
            </div>

            {initialProducts.length === 0 ? (
                <div className="text-center py-24 bg-card border-2 border-dashed rounded-[3rem]">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">No items found</h3>
                    <p className="text-muted-foreground font-medium mb-8 max-w-xs mx-auto">Try adjusting your search or filters to find what you need.</p>
                    <Link href="/marketplace/sell">
                        <Button variant="outline" className="rounded-xl px-8 h-12 font-bold">Sell Something Instead</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {initialProducts.map((product) => {
                        const discount = getDiscountPercentage(product.price, product.originalPrice);
                        return (
                            <Link key={product._id} href={`/marketplace/${product._id}`} className="group bg-card border-2 rounded-[2rem] overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                                <div className="relative h-56 bg-muted overflow-hidden">
                                    {product.images[0] ? (
                                        <Image src={product.images[0]} alt={product.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShoppingBag className="h-12 w-12 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded-lg">
                                        {product.condition}
                                    </div>
                                    {discount && (
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-lg">
                                            -{discount}%
                                        </div>
                                    )}
                                    {product.stock <= 5 && (
                                        <div className="absolute bottom-4 left-4 px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-lg shadow-lg">
                                            Low Stock
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-sm line-clamp-2 mb-3 h-10 group-hover:text-primary transition-colors">{product.title}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <p className="text-xl font-black text-primary">৳{product.price.toLocaleString()}</p>
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <p className="text-xs text-muted-foreground line-through font-medium">৳{product.originalPrice.toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 border-t pt-4">
                                        <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-1.5 uppercase tracking-wide">
                                            <MapPin className="h-3 w-3 text-primary" /> {product.location}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wide">
                                            {product.category} • {product.views} views
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
