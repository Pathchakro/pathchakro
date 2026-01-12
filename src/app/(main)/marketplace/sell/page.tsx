'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/uploads/ImageUploader';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';

const productSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    category: z.string().min(1, 'Category is required'),
    price: z.number().min(1, 'Price must be at least ৳1'),
    originalPrice: z.number().optional(),
    stock: z.number().min(1, 'Stock must be at least 1'),
    condition: z.string().min(1, 'Condition is required'),
    location: z.string().min(3, 'Location is required'),
    tags: z.string().optional(),
});

type ProductData = z.infer<typeof productSchema>;

export default function SellPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [productImages, setProductImages] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProductData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            stock: 1,
            condition: 'new',
        },
    });

    const onSubmit = async (data: ProductData) => {
        if (productImages.length === 0) {
            setError('Please upload at least one product image');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    images: productImages,
                    tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to create product');
                return;
            }

            router.push(`/marketplace/${result.product._id}`);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">Sell an Item</CardTitle>
                            <CardDescription>
                                List your books or stationery for sale
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Product Images */}
                        <div className="space-y-2">
                            <Label>Product Images * (Upload up to 4)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[0, 1, 2, 3].map((index) => (
                                    <div key={index}>
                                        <ImageUploader
                                            onUpload={(url) => {
                                                const newImages = [...productImages];
                                                newImages[index] = url;
                                                setProductImages(newImages.filter(Boolean));
                                            }}
                                            currentImage={productImages[index]}
                                            variant="post"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Product Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Calculus Textbook - 10th Edition"
                                {...register('title')}
                                disabled={isLoading}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the item, its condition, and any other relevant details..."
                                rows={4}
                                {...register('description')}
                                disabled={isLoading}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    id="category"
                                    {...register('category')}
                                    disabled={isLoading}
                                >
                                    <option value="">Select category</option>
                                    <option value="book">Book</option>
                                    <option value="notebook">Notebook</option>
                                    <option value="pen">Pen</option>
                                    <option value="calculator">Calculator</option>
                                    <option value="bag">Bag</option>
                                    <option value="other">Other</option>
                                </Select>
                                {errors.category && (
                                    <p className="text-sm text-red-500">{errors.category.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="condition">Condition *</Label>
                                <Select
                                    id="condition"
                                    {...register('condition')}
                                    disabled={isLoading}
                                >
                                    <option value="new">New</option>
                                    <option value="used">Used</option>
                                    <option value="refurbished">Refurbished</option>
                                </Select>
                                {errors.condition && (
                                    <p className="text-sm text-red-500">{errors.condition.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (৳) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="1"
                                    placeholder="500"
                                    {...register('price', { valueAsNumber: true })}
                                    disabled={isLoading}
                                />
                                {errors.price && (
                                    <p className="text-sm text-red-500">{errors.price.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="originalPrice">Original Price (৳)</Label>
                                <Input
                                    id="originalPrice"
                                    type="number"
                                    min="0"
                                    placeholder="800"
                                    {...register('originalPrice', { valueAsNumber: true })}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">Optional, for discount display</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stock">Stock/Quantity *</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min="1"
                                    {...register('stock', { valueAsNumber: true })}
                                    disabled={isLoading}
                                />
                                {errors.stock && (
                                    <p className="text-sm text-red-500">{errors.stock.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location/Area *</Label>
                            <Input
                                id="location"
                                placeholder="e.g., Dhanmondi, Dhaka"
                                {...register('location')}
                                disabled={isLoading}
                            />
                            {errors.location && (
                                <p className="text-sm text-red-500">{errors.location.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (Optional)</Label>
                            <Input
                                id="tags"
                                placeholder="math, science, engineering (comma separated)"
                                {...register('tags')}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">Help buyers find your item</p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? 'Listing...' : 'List Item'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
