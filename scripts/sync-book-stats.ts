require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const dbConnect = require('../src/lib/mongodb').default;
const Book = require('../src/models/Book').default;
const UserLibrary = require('../src/models/UserLibrary').default;

interface BookStat {
    _id: any;
    completedCount: number;
    copiesCount: number;
}

async function syncBookStats() {
    try {
        console.log('Connecting to database...');
        await dbConnect();

        console.log('Resetting stats for all books...');
        await Book.updateMany({}, { $set: { completedCount: 0, copies: 0 } });

        console.log('Aggregating UserLibrary stats...');
        const stats = await UserLibrary.aggregate([
            {
                $group: {
                    _id: '$book',
                    completedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    copiesCount: {
                        $sum: { $cond: [{ $eq: ['$isOwned', true] }, 1, 0] }
                    }
                }
            }
        ]);

        console.log(`Aggregated stats for ${stats.length} active books.`);

        if (stats.length > 0) {
            console.log('Performing bulk update...');
            const bulkOps = stats.map((stat: BookStat) => ({
                updateOne: {
                    filter: { _id: stat._id },
                    update: {
                        $set: {
                            completedCount: stat.completedCount,
                            copies: stat.copiesCount
                        }
                    }
                }
            }));

            const result = await Book.bulkWrite(bulkOps);
            console.log(`Sync Stats: ${result.modifiedCount} books updated.`);
        }

        console.log('Synchronization complete!');
        process.exit(0);
    } catch (error) {
        console.error('Synchronization failed:', error);
        process.exit(1);
    }
}

syncBookStats();
