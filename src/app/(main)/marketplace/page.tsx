'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ShoppingBag, Plus, Search, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

export default function MarketplacePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [conditionFilter, setConditionFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        fetchProducts();
    }, [categoryFilter, conditionFilter, searchQuery, minPrice, maxPrice]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.append('category', categoryFilter);
            if (conditionFilter) params.append('condition', conditionFilter);
            if (searchQuery) params.append('search', searchQuery);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);

            const response = await fetch(`/api/products?${params}`);
            const data = await response.json();

            if (data.products) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDiscountPercentage = (price: number, originalPrice?: number) => {
        if (!originalPrice || originalPrice <= price) return null;
        return Math.round(((originalPrice - price) / originalPrice) * 100);
    };

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold">Marketplace</h1>
                        <p className="text-muted-foreground">Buy and sell books & stationery</p>
                    </div>
                    <Link href="/marketplace/sell">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Sell Item
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products..."
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
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
                        onChange={(e) => setConditionFilter(e.target.value)}
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
                            onChange={(e) => setMinPrice(e.target.value)}
                            placeholder="Min ৳"
                            className="w-full"
                        />
                        <Input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            placeholder="Max ৳"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Loading products...
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-12">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No products found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery || categoryFilter || conditionFilter || minPrice || maxPrice
                            ? 'Try adjusting your filters'
                            : 'Be the first to list an item!'}
                    </p>
                    <Link href="/marketplace/sell">
                        <Button>Sell Your First Item</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => {
                        const discount = getDiscountPercentage(product.price, product.originalPrice);

                        return (
                            <Link
                                key={product._id}
                                href={`/marketplace/${product._id}`}
                                className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Product Image */}
                                <div className="relative h-48 bg-muted">
                                    {product.images[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}

                                    {/* Condition Badge */}
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md capitalize">
                                        {product.condition}
                                    </div>

                                    {/* Discount Badge */}
                                    {discount && (
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
                                            -{discount}%
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {product.stock <= 5 && (
                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-md">
                                            Only {product.stock} left
                                        </div>
                                    )}
                                </div>

                                <div className="p-3">
                                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.title}</h3>

                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="text-lg font-bold text-primary">৳{product.price.toLocaleString()}</p>
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <p className="text-sm text-muted-foreground line-through">
                                                ৳{product.originalPrice.toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                        <MapPin className="h-3 w-3" />
                                        {product.location}
                                    </p>

                                    <p className="text-xs text-muted-foreground capitalize">
                                        {product.category} • {product.views} views
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
