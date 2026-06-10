import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Bengali Transliteration Map
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
    // Normalize Unicode and trim
    let processedText = text.toString().normalize('NFKC').trim();

    const isNonAscii = /[^\x00-\x7F]/.test(processedText);
    if (isNonAscii) {
        processedText = transliterateBengali(processedText);
    }

    return processedText.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
        .substring(0, 100); // Enforce max length
};

const eventSchema = new mongoose.Schema({
    title: String,
    slug: { type: String, unique: true },
    startTime: Date
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

async function runMigration() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        const dbName = process.env.DB_NAME;
        await mongoose.connect(MONGODB_URI, { dbName });
        console.log(`✅ Connected to MongoDB (${dbName || 'default'})`);

        console.log('📦 Fetching all events...');
        const events = await Event.find({}).lean();
        console.log(`🔍 Found ${events.length} events to process.`);

        // In-memory mapping of slugs to document IDs to handle uniqueness efficiently
        const slugMap = new Map();
        events.forEach(e => {
            if (e.slug) slugMap.set(e.slug, e._id.toString());
        });

        const bulkOps = [];
        let updatedCount = 0;
        let skippedCount = 0;

        console.log('⚙️ Computing new slugs...');

        for (const event of events) {
            const eventId = event._id.toString();
            const oldSlug = event.slug;

            let dateStr = '';
            if (event.startTime) {
                const startDate = new Date(event.startTime);
                if (!isNaN(startDate.getTime())) {
                    dateStr = startDate.toISOString().split('T')[0];
                }
            }

            const combinedTitle = dateStr ? `${event.title}-${dateStr}` : event.title;
            const newBaseSlug = createSlug(combinedTitle);

            let finalSlug = newBaseSlug;
            let counter = 1;

            // In-memory uniqueness check
            while (slugMap.has(finalSlug) && slugMap.get(finalSlug) !== eventId) {
                finalSlug = `${newBaseSlug}-${counter}`;
                counter++;
            }

            if (oldSlug !== finalSlug) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: event._id },
                        update: { $set: { slug: finalSlug } }
                    }
                });

                // Update in-memory map to reflect the change for subsequent checks
                if (oldSlug) slugMap.delete(oldSlug);
                slugMap.set(finalSlug, eventId);

                updatedCount++;
            } else {
                skippedCount++;
            }
        }

        if (bulkOps.length > 0) {
            console.log(`🚀 Executing ${bulkOps.length} batch updates...`);
            await Event.bulkWrite(bulkOps);
            console.log('✨ Batch updates completed.');
        }

        console.log('\n🏁 Migration Summary:');
        console.log(`✅ Total Updated: ${updatedCount}`);
        console.log(`⏩ Total Skipped: ${skippedCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
