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

    const trimmedText = text.trim();
    const isNonAscii = /[^\x00-\x7F]/.test(trimmedText);

    let slug = '';
    
    // Only use slugify package for pure ASCII to avoid stripping Unicode chars
    if (!isNonAscii) {
        slug = slugify(trimmedText, { lower: true, strict: true, trim: true });
    }

    if (!slug) {
        // Fallback or primary logic for non-ASCII (e.g. Bengali)
        slug = trimmedText.toLowerCase()
            .replace(/[\s-]+/g, '-')
            .replace(/[^\p{L}\p{N}\p{M}-]/gu, '') // Keep letters, numbers, AND marks (vowels)
            .replace(/\-\-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    return slug || `untitled-${Date.now()}`;
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
