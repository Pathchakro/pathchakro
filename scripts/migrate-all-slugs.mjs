import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
}

// Bengali Transliteration Logic
const bengaliToEnglishMap = {
    'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng', 'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n', 'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm', 'য': 'y', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
    'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
    '্': '', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

const transliterateBengali = (text) => {
    return text.split('').map(char => bengaliToEnglishMap[char] || char).join('');
};

const createSlug = (text) => {
    if (!text) return '';
    let processedText = text.toString().trim();
    const isNonAscii = /[^\x00-\x7F]/.test(processedText);
    if (isNonAscii) {
        processedText = transliterateBengali(processedText);
    }
    return processedText.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const collectionsToMigrate = [
    { name: 'events', modelName: 'Event', slugBaseFields: ['title', 'startTime'], dateField: 'startTime' },
    { name: 'books', modelName: 'Book', slugBaseFields: ['title', 'author'] },
    { name: 'posts', modelName: 'Post', slugBaseFields: ['title'] },
    { name: 'courses', modelName: 'Course', slugBaseFields: ['title'] },
    { name: 'tours', modelName: 'Tour', slugBaseFields: ['title'] },
    { name: 'teams', modelName: 'Team', slugBaseFields: ['name'] },
    { name: 'authors', modelName: 'Author', slugBaseFields: ['name'] },
    { name: 'categories', modelName: 'Category', slugBaseFields: ['name'] },
    { name: 'institutes', modelName: 'Institute', slugBaseFields: ['name'] },
    { name: 'contests', modelName: 'Contest', slugBaseFields: ['title'] },
    { name: 'assignments', modelName: 'Assignment', slugBaseFields: ['title'] },
    { name: 'writingprojects', modelName: 'WritingProject', slugBaseFields: ['title'] },
    { name: 'products', modelName: 'Product', slugBaseFields: ['title'] },
    { name: 'reviews', modelName: 'Review', slugBaseFields: ['title'] },
    { name: 'bloodrequests', modelName: 'BloodRequest', slugBaseFields: ['hospital'] }
];

async function migrateCollection(db, config) {
    console.log(`\n📂 Migrating ${config.name}...`);
    const collection = db.collection(config.name);
    const docs = await collection.find({}).toArray();
    console.log(`   Found ${docs.length} documents.`);

    let updatedCount = 0;
    for (const doc of docs) {
        const oldSlug = doc.slug;

        // Build base text for slug
        let baseTextParts = config.slugBaseFields.map(field => {
            if (field === config.dateField && doc[field]) {
                return doc[field] instanceof Date ? doc[field].toISOString().split('T')[0] : doc[field].toString().split('T')[0];
            }
            return doc[field] || '';
        }).filter(Boolean);

        const baseText = baseTextParts.join(' ');
        const newBaseSlug = createSlug(baseText);

        let finalSlug = newBaseSlug;
        let counter = 1;

        // Uniqueness check
        while (true) {
            const existing = await collection.findOne({ slug: finalSlug, _id: { $ne: doc._id } });
            if (!existing) break;
            finalSlug = `${newBaseSlug}-${counter}`;
            counter++;
        }

        if (oldSlug !== finalSlug) {
            await collection.updateOne({ _id: doc._id }, { $set: { slug: finalSlug } });
            updatedCount++;
            if (docs.length < 50) console.log(`   ✨ Updated: "${doc.title || doc.name}" -> ${finalSlug}`);
        }
    }

    // Special case for WritingProject chapters
    if (config.name === 'writingprojects') {
        console.log(`   📝 Checking WritingProject chapters...`);
        let chapterUpdatedCount = 0;
        for (const doc of docs) {
            if (doc.chapters && Array.isArray(doc.chapters)) {
                let modified = false;
                const updatedChapters = doc.chapters.map(chapter => {
                    const oldChapterSlug = chapter.slug;
                    const newChapterSlug = createSlug(chapter.title);
                    if (oldChapterSlug !== newChapterSlug) {
                        modified = true;
                        chapterUpdatedCount++;
                        return { ...chapter, slug: newChapterSlug };
                    }
                    return chapter;
                });

                if (modified) {
                    await collection.updateOne({ _id: doc._id }, { $set: { chapters: updatedChapters } });
                }
            }
        }
        console.log(`   ✅ Updated ${chapterUpdatedCount} chapters.`);
    }

    console.log(`   ✅ Finished ${config.name}. Updated: ${updatedCount}`);
    return updatedCount;
}

async function run() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
        const db = mongoose.connection.db;
        console.log('✅ Connected.');

        let totalUpdated = 0;
        for (const config of collectionsToMigrate) {
            totalUpdated += await migrateCollection(db, config);
        }

        console.log(`\n🎉 ALL DONE! Total documents updated across all collections: ${totalUpdated}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

run();
