import { Model } from 'mongoose';
import slugify from 'slugify';

// Helper to escape regex special characters
const escapeRegex = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Use the package if available, or fallback to a simple implementation
const createSlug = (text: string): string => {
    if (!text || typeof text !== 'string' || !text.trim()) {
        return `untitled-${Date.now()}`;
    }

    const slug = slugify(text, { lower: true, strict: true, trim: true });

    if (slug) return slug;

    // Fallback for non-ASCII (e.g. Bengali)
    const manualSlug = text.trim().toLowerCase()
        .replace(/[\s-]+/g, '-')
        .replace(/[^a-z0-9-]/g, '') // Keep it safe for a slug
        .replace(/^-+|-+$/g, '');

    return manualSlug || `untitled-${Date.now()}`;
};

export async function generateUniqueSlug(
    model: Model<any>,
    text: string,
    field: string = 'slug',
    isUpdate: boolean = false,
    currentId: string = ''
): Promise<string> {
    const baseSlug = createSlug(text);

    // First check if the base slug exists
    // If updating, exclude the current document
    const query: any = { [field]: baseSlug };
    if (isUpdate && currentId) {
        query._id = { $ne: currentId };
    }

    const existing = await model.findOne(query);
    if (!existing) {
        return baseSlug;
    }

    // Existing found, find all matching slugs to determine the next suffix
    // Pattern: baseSlug or baseSlug-1, baseSlug-2, etc.
    const escapedBaseSlug = escapeRegex(baseSlug);
    const regex = new RegExp(`^${escapedBaseSlug}(-[0-9]+)?$`, 'i');

    const similarQuery: any = { [field]: regex };
    if (isUpdate && currentId) {
        similarQuery._id = { $ne: currentId };
    }

    const similarDocs = await model.find(similarQuery).select(field);

    if (similarDocs.length === 0) {
        return baseSlug; // Should have been caught by findOne, but safe fallback
    }

    // Extract suffixes
    const suffixes = similarDocs.map(doc => {
        const slug = doc[field] as string;
        if (slug === baseSlug) return 0;
        const parts = slug.split('-');
        const suffix = parts[parts.length - 1];
        return parseInt(suffix, 10) || 0;
    });

    const maxSuffix = Math.max(...suffixes);
    return `${baseSlug}-${maxSuffix + 1}`;
}
