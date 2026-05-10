import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Book from '@/models/Book';
import WritingProject from '@/models/WritingProject';
import Post from '@/models/Post';
import Team from '@/models/Team';
import Order from '@/models/Order';
import { subDays } from 'date-fns';

/**
 * Internal function to fetch platform-wide analytics.
 * Defined at module scope for persistent caching.
 */
const fetchAdminAnalytics = unstable_cache(
    async (period: string) => {
        try {
            await dbConnect();
            
            // Validate period input
            const daysInt = parseInt(period, 10);
            const days = isNaN(daysInt) || daysInt <= 0 ? 30 : daysInt;
            const startDate = subDays(new Date(), days);

            // Fetch total counts for platform-wide metrics
            const [
                totalUsers, totalProducts, totalBooks, totalWritingProjects, totalPosts, totalTeams,
                orders
            ] = await Promise.all([
                User.countDocuments(),
                Product.countDocuments(),
                Book.countDocuments(),
                WritingProject.countDocuments(),
                Post.countDocuments(),
                Team.countDocuments(),
                Order.find({ 
                    createdAt: { $gte: startDate },
                    status: 'completed'
                }).lean()
            ]);

            // Financial aggregation
            const totalRevenue = orders.reduce((sum, o: any) => sum + (o.totalPrice || 0), 0);
            const totalPlatformFee = orders.reduce((sum, o: any) => sum + (o.platformFee || 0), 0);
            const totalSellerEarnings = totalRevenue - totalPlatformFee;

            return {
                platformStats: {
                    totalUsers,
                    totalProducts,
                    totalBooks,
                    totalWritingProjects,
                    totalPosts,
                    totalTeams,
                },
                financials: {
                    totalRevenue,
                    totalPlatformFee,
                    totalSellerEarnings,
                    totalTransactions: orders.length,
                    averageTransactionValue: orders.length > 0 ? totalRevenue / orders.length : 0
                },
                recentTransactions: JSON.parse(JSON.stringify(orders.slice(-10).reverse()))
            };
        } catch (error) {
            console.error('[ADMIN_ANALYTICS_ERROR]:', error);
            return {
                platformStats: { totalUsers: 0, totalProducts: 0, totalBooks: 0, totalWritingProjects: 0, totalPosts: 0, totalTeams: 0 },
                financials: { totalRevenue: 0, totalPlatformFee: 0, totalSellerEarnings: 0, totalTransactions: 0, averageTransactionValue: 0 },
                recentTransactions: []
            };
        }
    },
    ['admin-analytics'],
    {
        tags: ['admin', 'analytics'],
        revalidate: 3600 // 1 hour
    }
);

/**
 * Public function to fetch platform-wide analytics for admin.
 * Standardizes the query interface while using persistent caching.
 */
export const getCachedAdminAnalytics = async (period: string = '30') => {
    return fetchAdminAnalytics(period);
};
