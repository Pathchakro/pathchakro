import { Schema, model, models } from 'mongoose';

export interface IProduct {
    _id: string;
    seller: string;
    slug: string;
    title: string;
    description: string;
    category: 'book' | 'notebook' | 'pen' | 'calculator' | 'bag' | 'other';
    price: number;
    originalPrice?: number;
    images: string[];
    stock: number;
    condition: 'new' | 'used' | 'refurbished';
    status: 'active' | 'sold' | 'inactive';
    tags: string[];
    location: string;
    views: number;
    createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        seller: {
            type: Schema.Types.ObjectId as any,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Product title is required'],
            trim: true,
            index: true,
        },
        slug: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: [true, 'Product description is required'],
        },
        category: {
            type: String,
            enum: ['book', 'notebook', 'pen', 'calculator', 'bag', 'other'],
            required: true,
            index: true,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: 0,
            index: true,
        },
        originalPrice: {
            type: Number,
            min: 0,
        },
        images: {
            type: [String],
            validate: {
                validator: function (arr: string[]) {
                    return arr.length > 0;
                },
                message: 'At least one image is required',
            },
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 1,
        },
        condition: {
            type: String,
            enum: ['new', 'used', 'refurbished'],
            required: true,
            default: 'new',
        },
        status: {
            type: String,
            enum: ['active', 'sold', 'inactive'],
            default: 'active',
            index: true,
        },
        tags: [String],
        location: {
            type: String,
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
ProductSchema.index({ category: 1, status: 1, price: 1 });
ProductSchema.index({ seller: 1, status: 1 });
ProductSchema.index({ title: 'text', description: 'text' });

const Product = models.Product || model<IProduct>('Product', ProductSchema);

export default Product;
