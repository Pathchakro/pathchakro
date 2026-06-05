const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pathchakro:exKw8X2Mjvef1kok@cluster0.eyqbkdb.mongodb.net/pathchakro?appName=Cluster0';

async function run() {
    console.log('Connecting to', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Copy schema
    const WritingProjectSchema = new mongoose.Schema(
        {
            author: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            title: {
                type: String,
                required: [true, 'Book title is required'],
                trim: true,
            },
            slug: {
                type: String,
                unique: true,
                sparse: true,
                trim: true,
                index: true,
                validate: {
                    validator: function (v) {
                        return /^[^\s\/\\?#]+$/.test(v);
                    },
                    message: (props) => `${props.value} contains invalid characters (spaces or /?# are not allowed)`
                }
            },
            coverImage: String,
            introduction: String,
            description: String,
            category: [String],
            status: {
                type: String,
                enum: ['draft', 'published'],
                default: 'draft',
            },
            visibility: {
                type: String,
                enum: ['private', 'public'],
                default: 'public',
            },
            chapters: [{
                chapterNumber: {
                    type: Number,
                    required: true,
                },
                title: {
                    type: String,
                    required: true,
                },
                slug: {
                    type: String,
                    required: true,
                },
                image: String,
                content: {
                    type: String,
                    required: true,
                },
                wordCount: {
                    type: Number,
                    default: 0,
                },
                status: {
                    type: String,
                    enum: ['draft', 'published'],
                    default: 'draft',
                },
                visibility: {
                    type: String,
                    enum: ['private', 'public'],
                    default: 'public',
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            }],
            totalWords: {
                type: Number,
                default: 0,
            },
            totalChapters: {
                type: Number,
                default: 0,
            },
            forSale: {
                type: Boolean,
                default: false,
            },
            salePrice: Number,
            saleType: {
                type: String,
                enum: ['physical', 'pdf', 'both'],
            },
        },
        {
            timestamps: true,
        }
    );

    const WritingProject = mongoose.models.WritingProject || mongoose.model('WritingProject', WritingProjectSchema);

    try {
        console.log('Trying to create a project...');
        const project = await WritingProject.create({
            author: new mongoose.Types.ObjectId(), // mock user id
            title: 'বাংলাদেশের নদী',
            slug: 'baanlaadesher-ndii',
            coverImage: 'https://res.cloudinary.com/dsd0jevgl/image/upload/v1780623696549.png',
            introduction: 'Test intro',
            description: 'Test desc',
            category: ['Literature'],
            status: 'draft',
            visibility: 'private',
            chapters: [],
            totalWords: 0,
            totalChapters: 0,
            forSale: false,
        });
        console.log('Successfully created project!', project._id);
        // Let's clean up
        await WritingProject.deleteOne({ _id: project._id });
        console.log('Cleaned up!');
    } catch (err) {
        console.error('ERROR OCCURRED:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
