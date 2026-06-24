import { MetadataRoute } from "next";
import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import Book from "@/models/Book";
import Course from "@/models/Course";
import Tour from "@/models/Tour";
import WritingProject from "@/models/WritingProject";
import Post from "@/models/Post";
import Review from "@/models/Review";
import Team from "@/models/Team";
import Event from "@/models/Event";
import Contest from "@/models/Contest";
import Product from "@/models/Product";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const getDynamicRoutes = async (baseUrl: string): Promise<MetadataRoute.Sitemap> => {
  try {
    await dbConnect();

    // Fetch all dynamic entities
    const [books, courses, tours, writingProjects, posts, reviews, teams, events, contests, products, users] = await Promise.all([
      Book.find({}, "slug updatedAt").sort({ updatedAt: -1 }).limit(10000).lean().exec(),
      Course.find({}, "slug updatedAt").sort({ updatedAt: -1 }).limit(1000).lean().exec(),
      Tour.find({}, "slug updatedAt").sort({ updatedAt: -1 }).limit(1000).lean().exec(),
      WritingProject.find({}, "slug chapters updatedAt").sort({ updatedAt: -1 }).limit(2000).lean().exec(),
      Post.find({}, "slug _id updatedAt").sort({ updatedAt: -1 }).limit(10000).lean().exec(),
      Review.find({}, "slug _id updatedAt").sort({ updatedAt: -1 }).limit(10000).lean().exec(),
      Team.find({}, "slug updatedAt").sort({ updatedAt: -1 }).limit(1000).lean().exec(),
      Event.find({}, "slug _id updatedAt").sort({ updatedAt: -1 }).limit(2000).lean().exec(),
      Contest.find({}, "slug _id updatedAt").sort({ updatedAt: -1 }).limit(1000).lean().exec(),
      Product.find({}, "slug _id updatedAt").sort({ updatedAt: -1 }).limit(5000).lean().exec(),
      User.find({}, "username _id updatedAt").sort({ updatedAt: -1 }).limit(10000).lean().exec(),
    ]);

    const bookRoutes: MetadataRoute.Sitemap = books
      .map((item: any) => ({
        url: `${baseUrl}/books/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }));

    const courseRoutes: MetadataRoute.Sitemap = courses
      .map((item: any) => ({
        url: `${baseUrl}/courses/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    const tourRoutes: MetadataRoute.Sitemap = tours
      .map((item: any) => ({
        url: `${baseUrl}/tours/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    const writingRoutes: MetadataRoute.Sitemap = writingProjects
      .map((item: any) => ({
        url: `${baseUrl}/writing/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      }));

    // Generate dynamic chapter reading routes from writing projects
    const chapterRoutes: MetadataRoute.Sitemap = [];
    writingProjects.forEach((project: any) => {
      const projectSlug = project.slug || project._id;
      if (project.chapters && Array.isArray(project.chapters)) {
        project.chapters.forEach((chapter: any) => {
          const chapterSlugPart = chapter.slug ? chapter.slug.split('/').pop() : chapter._id;
          chapterRoutes.push({
            url: `${baseUrl}/read/${projectSlug}/${chapterSlugPart}`,
            lastModified: chapter.updatedAt || project.updatedAt || new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
          });
        });
      }
    });

    const postRoutes: MetadataRoute.Sitemap = posts
      .map((item: any) => ({
        url: `${baseUrl}/posts/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.6,
      }));

    const reviewRoutes: MetadataRoute.Sitemap = reviews
      .map((item: any) => ({
        url: `${baseUrl}/reviews/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      }));

    const teamRoutes: MetadataRoute.Sitemap = teams
      .map((item: any) => ({
        url: `${baseUrl}/teams/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    const eventRoutes: MetadataRoute.Sitemap = events
      .map((item: any) => ({
        url: `${baseUrl}/events/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }));

    const contestRoutes: MetadataRoute.Sitemap = contests
      .map((item: any) => ({
        url: `${baseUrl}/contests/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    const productRoutes: MetadataRoute.Sitemap = products
      .map((item: any) => ({
        url: `${baseUrl}/marketplace/${item.slug || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }));

    const userRoutes: MetadataRoute.Sitemap = users
      .map((item: any) => ({
        url: `${baseUrl}/profile/${item.username || item._id}`,
        lastModified: item.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      }));

    return [
      ...bookRoutes,
      ...courseRoutes,
      ...tourRoutes,
      ...writingRoutes,
      ...chapterRoutes,
      ...postRoutes,
      ...reviewRoutes,
      ...teamRoutes,
      ...eventRoutes,
      ...contestRoutes,
      ...productRoutes,
      ...userRoutes,
    ];
  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
    return [];
  }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const host = headersList.get('host') || 'pathchakro.com';
  
  const forwardedProto = headersList.get('x-forwarded-proto');
  const protocol = forwardedProto || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;

  const dynamicRoutes = await getDynamicRoutes(baseUrl);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tours`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/writing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contests`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blood-bank`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blood-donors`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blood-donors/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/pay`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/library`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/messages`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/notifications`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/reading-status`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/assignments`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/profile/edit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/complete-profile`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin/courses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin/fund`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/admin/tours`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
