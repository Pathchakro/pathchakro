const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.local' });

// We can just mock the import of slug-utils by copying the functions from JS compiled output or compiling them
// Let's run a small test to see if slugify works
const slugify = require('slugify');
const { transliterate } = require('transliteration');

function transliterateBengali(text) {
    return transliterate(text);
}

const createSlug = (text) => {
    if (!text || typeof text !== 'string' || !text.trim()) {
        return `untitled-${Date.now()}`;
    }

    let trimmedText = text.trim();
    const isNonAscii = /[^\x00-\x7F]/.test(trimmedText);

    if (isNonAscii) {
        trimmedText = transliterateBengali(trimmedText);
    }

    let slug = slugify(trimmedText, { lower: true, strict: true, trim: true });

    if (!slug) {
        slug = trimmedText.toLowerCase()
            .replace(/[\s-]+/g, '-')
            .replace(/[^\p{L}\p{N}\p{M}-]/gu, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    return slug || `untitled-${Date.now()}`;
};

async function generateUniqueSlug(model, text, field = 'slug') {
    const baseSlug = createSlug(text);
    console.log('baseSlug generated:', baseSlug);
    const query = { [field]: baseSlug };
    const existing = await model.findOne(query);
    if (!existing) {
        return baseSlug;
    }
    return baseSlug + '-unique';
}

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const WritingProjectSchema = new mongoose.Schema({
        author: { type: mongoose.Schema.Types.ObjectId, required: true },
        title: { type: String, required: true },
        slug: { type: String, unique: true },
    });
    const WritingProject = mongoose.models.WritingProject || mongoose.model('WritingProject', WritingProjectSchema);

    try {
        const slug = await generateUniqueSlug(WritingProject, 'বাংলাদেশের নদী');
        console.log('Generated unique slug:', slug);

        const project = await WritingProject.create({
            author: new mongoose.Types.ObjectId(),
            title: 'বাংলাদেশের নদী',
            slug: slug
        });
        console.log('Project created successfully with slug:', project.slug);
        await WritingProject.deleteOne({ _id: project._id });
        console.log('Cleaned up!');
    } catch (err) {
        console.error('ERROR OCCURRED:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
