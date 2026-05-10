'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShoppingBag, MapPin, Eye, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    stock: number;
    category: string;
    condition: string;
    location: string;
    images: string[];
    views: number;
    seller: {
        _id: string;
        name: string;
        username: string;
        image?: string;
        university?: string;
        rankTier?: string;
    };
    createdAt?: string | Date;
}

interface ProductDetailClientProps {
    initialProduct: Product;
    productId: string;
}

export default function ProductDetailClient({ initialProduct, productId }: ProductDetailClientProps) {
    const router = useRouter();
    const [product] = useState<Product>(initialProduct);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isOrdering, setIsOrdering] = useState(false);

    // Order form
    const [quantity, setQuantity] = useState(1);
    const [buyerPhone, setBuyerPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [notes, setNotes] = useState('');

    const handleOrder = async () => {
        if (!buyerPhone || !deliveryAddress) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (quantity < 1 || (product && quantity > product.stock)) {
            toast.error(`Please enter a valid quantity (1-${product?.stock})`);
            return;
        }

        setIsOrdering(true);
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                toast.success('Order placed successfully! The seller will contact you soon.');
                router.push('/marketplace/orders');
            } else {
                toast.error(data?.error ?? 'An error occurred');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error('Failed to place order');
        } finally {
            setIsOrdering(false);
        }
    };

    const discount = product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : null;

    // Defensive check for seller initial
    const sellerInitial = (product.seller?.name?.trim()?.[0] || "S").toUpperCase();
    
    // Defensive check for images array
    const hasImages = Array.isArray(product.images) && product.images.length > 0;
    const currentImage = hasImages ? (product.images[selectedImage] || product.images[0]) : null;

    return (
        <div className="max-w-6xl mx-auto p-4 pb-20">
            <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors group">
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ArrowLeft className="h-4 w-4" />
                </div>
                Back to Marketplace
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: Images */}
                <div className="space-y-4">
                    <div className="bg-card border-2 shadow-sm rounded-3xl overflow-hidden group">
                        <div className="relative h-[450px] bg-muted/20">
                            {currentImage ? (
                                <Image
                                    src={currentImage}
                                    alt={product.title}
                                    fill
                                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShoppingBag className="h-24 w-24 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>
                    </div>

                    {hasImages && product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-3">
                            {product.images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative h-24 bg-muted/20 border-2 rounded-2xl overflow-hidden transition-all transform hover:scale-95 ${selectedImage === index ? 'border-primary shadow-lg scale-100' : 'border-transparent opacity-60'}`}
                                >
                                    <Image src={img} alt={`${product.title} ${index + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details & Order */}
                <div className="space-y-6">
                    <div className="bg-card border-2 shadow-sm rounded-3xl p-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] px-3 py-1 bg-muted font-black uppercase tracking-widest rounded-full">{product.category}</span>
                                <span className="text-[10px] px-3 py-1 bg-blue-50 text-blue-700 font-black uppercase tracking-widest rounded-full border border-blue-100">{product.condition}</span>
                            </div>
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Eye className="h-3 w-3" />{product.views} views</p>
                        </div>

                        <h1 className="text-3xl font-black mb-4 leading-tight">{product.title}</h1>

                        <div className="flex items-baseline gap-4 mb-6">
                            <p className="text-4xl font-black text-primary">৳{product.price.toLocaleString()}</p>
                            {product.originalPrice && product.originalPrice > product.price && (
                                <>
                                    <p className="text-xl text-muted-foreground line-through decoration-red-500/50 decoration-2">৳{product.originalPrice.toLocaleString()}</p>
                                    {discount && <span className="text-sm font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">-{discount}%</span>}
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5"><Package className="h-3 w-3" /> Availability</p>
                                <p className={`text-sm font-bold ${product.stock <= 5 ? 'text-orange-600' : 'text-foreground'}`}>{product.stock > 0 ? `${product.stock} Units Left` : 'Out of Stock'}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-2xl space-y-1">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Location</p>
                                <p className="text-sm font-bold line-clamp-1">{product.location}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t-2 border-dashed mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Product Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{product.description}</p>
                        </div>

                        <div className="pt-6 border-t-2 border-dashed">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Seller Information</h3>
                            <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border-2 border-primary/10">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">{sellerInitial}</div>
                                <div>
                                    <p className="font-black text-base">{product.seller?.name || "Verified Seller"}</p>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{product.seller?.university || product.seller?.rankTier || "Community Member"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Form */}
                    <div className="bg-card border-2 shadow-xl rounded-3xl p-8 transform transition-all hover:shadow-2xl">
                        <h2 className="font-black text-xl mb-6 flex items-center gap-2 uppercase tracking-tight">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                            Place Secure Order
                        </h2>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="font-bold ml-1">Select Quantity *</Label>
                                <div className="flex items-center gap-4">
                                    <Input 
                                        id="quantity" 
                                        type="number" 
                                        min="1" 
                                        max={product.stock} 
                                        value={quantity} 
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                                        className="h-12 rounded-xl border-2 focus-visible:ring-primary font-bold"
                                    />
                                    <div className="flex-1 bg-muted/50 h-12 rounded-xl flex items-center px-4 border-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total: <span className="text-primary font-black text-base ml-1">৳{(product.price * quantity).toLocaleString()}</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="font-bold ml-1">Phone Number *</Label>
                                <Input 
                                    id="phone" 
                                    type="tel" 
                                    placeholder="+880 1XXXXXXXXX" 
                                    value={buyerPhone} 
                                    onChange={(e) => setBuyerPhone(e.target.value)} 
                                    className="h-12 rounded-xl border-2 focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address" className="font-bold ml-1">Delivery Address *</Label>
                                <Textarea 
                                    id="address" 
                                    placeholder="Enter full delivery address..." 
                                    rows={3} 
                                    value={deliveryAddress} 
                                    onChange={(e) => setDeliveryAddress(e.target.value)} 
                                    className="rounded-2xl border-2 focus-visible:ring-primary resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes" className="font-bold ml-1">Notes (Optional)</Label>
                                <Textarea 
                                    id="notes" 
                                    placeholder="Special instructions..." 
                                    rows={2} 
                                    value={notes} 
                                    onChange={(e) => setNotes(e.target.value)} 
                                    className="rounded-2xl border-2 focus-visible:ring-primary resize-none"
                                />
                            </div>
                            <Button 
                                onClick={handleOrder} 
                                disabled={isOrdering || product.stock === 0} 
                                size="lg"
                                className="w-full h-14 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                {isOrdering ? (
                                    <><div className="h-5 w-5 border-4 border-white/30 border-t-white animate-spin rounded-full mr-2" /> Processing...</>
                                ) : product.stock === 0 ? 'Out of Stock' : (
                                    <><ShoppingBag className="mr-2 h-5 w-5" /> Confirm Purchase</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
