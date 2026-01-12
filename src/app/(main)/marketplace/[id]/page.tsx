'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShoppingBag, MapPin, Eye, ArrowLeft, User, Package } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
    _id: string;
    seller: {
        _id: string;
        name: string;
        image?: string;
        university?: string;
        rankTier: string;
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
    tags: string[];
    views: number;
    createdAt: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isOrdering, setIsOrdering] = useState(false);

    // Order form
    const [quantity, setQuantity] = useState(1);
    const [buyerPhone, setBuyerPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const response = await fetch(`/api/products/${productId}`);
            const data = await response.json();

            if (data.product) {
                setProduct(data.product);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrder = async () => {
        if (!buyerPhone || !deliveryAddress) {
            alert('Please fill in all required fields');
            return;
        }

        if (quantity < 1 || (product && quantity > product.stock)) {
            alert(`Please enter a valid quantity (1-${product?.stock})`);
            return;
        }

        setIsOrdering(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    quantity,
                    buyerPhone,
                    deliveryAddress,
                    notes,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Order placed successfully! The seller will contact you soon.');
                window.location.href = '/marketplace/orders';
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order');
        } finally {
            setIsOrdering(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    Loading product...
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-6xl mx-auto p-4">
                <div className="bg-card rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">Product not found</h2>
                    <Link href="/marketplace">
                        <Button>Back to Marketplace</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

    return (
        <div className="max-w-6xl mx-auto p-4">
            <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Images */}
                <div>
                    <div className="bg-card border rounded-lg overflow-hidden mb-3">
                        <div className="relative h-96 bg-muted">
                            {product.images[selectedImage] ? (
                                <Image
                                    src={product.images[selectedImage]}
                                    alt={product.title}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShoppingBag className="h-24 w-24 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Image Thumbnails */}
                    {product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative h-20 bg-muted border-2 rounded-lg overflow-hidden ${selectedImage === index ? 'border-primary' : 'border-transparent'
                                        }`}
                                >
                                    <Image
                                        src={img}
                                        alt={`${product.title} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details & Order */}
                <div>
                    <div className="bg-card border rounded-lg p-6 mb-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">
                                    {product.category}
                                </span>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full ml-2 capitalize">
                                    {product.condition}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {product.views} views
                            </p>
                        </div>

                        <h1 className="text-2xl font-bold mb-3">{product.title}</h1>

                        <div className="flex items-baseline gap-3 mb-4">
                            <p className="text-3xl font-bold text-primary">৳{product.price.toLocaleString()}</p>
                            {product.originalPrice && product.originalPrice > product.price && (
                                <>
                                    <p className="text-lg text-muted-foreground line-through">
                                        ৳{product.originalPrice.toLocaleString()}
                                    </p>
                                    {discount && (
                                        <span className="text-sm font-bold text-red-500">
                                            {discount}% OFF
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Stock:</span>
                                <span className={product.stock <= 5 ? 'text-orange-600 font-semibold' : ''}>
                                    {product.stock} available
                                </span>
                            </p>
                            <p className="text-sm flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Location:</span>
                                {product.location}
                            </p>
                        </div>

                        <div className="border-t pt-4 mb-4">
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {product.description}
                            </p>
                        </div>

                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {product.tags.map((tag, index) => (
                                    <span key={index} className="text-xs px-2 py-1 bg-muted rounded-full">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="border-t pt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                    {product.seller.name[0]}
                                </div>
                                <div>
                                    <p className="font-medium">{product.seller.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {product.seller.university || product.seller.rankTier}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Form */}
                    <div className="bg-card border rounded-lg p-6">
                        <h2 className="font-semibold text-lg mb-4">Place Order</h2>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="quantity">Quantity *</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max={product.stock}
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total: ৳{(product.price * quantity).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="phone">Your Phone Number *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+880 1XXXXXXXXX"
                                    value={buyerPhone}
                                    onChange={(e) => setBuyerPhone(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="address">Delivery Address *</Label>
                                <Textarea
                                    id="address"
                                    placeholder="Enter your full delivery address..."
                                    rows={3}
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any special instructions..."
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                onClick={handleOrder}
                                disabled={isOrdering || product.stock === 0}
                                className="w-full"
                            >
                                {isOrdering ? 'Placing Order...' : product.stock === 0 ? 'Out of Stock' : 'Place Order'}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                The seller will contact you using the provided phone number
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
