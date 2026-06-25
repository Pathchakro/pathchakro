import mongoose from 'mongoose';
import { getEmbedding } from '@/lib/embeddings';
import dbConnect from '@/lib/mongodb';

// Import Mongoose models to query
import Book from '@/models/Book';
import Course from '@/models/Course';
import Tour from '@/models/Tour';
import Post from '@/models/Post';
import Review from '@/models/Review';
import BloodDonor from '@/models/BloodDonor';
import Product from '@/models/Product';
import WritingProject from '@/models/WritingProject';
import Event from '@/models/Event';
import User from '@/models/User';
import UserLibrary from '@/models/UserLibrary';

interface RetrievedDocument {
  source: string;
  title: string;
  text: string;
  url?: string;
  score?: number;
}

/**
 * Searches the MongoDB database semantically using vector similarity.
 */
export async function retrieveRelevantContext(query: string, userId?: string, limitPerModel = 2): Promise<string> {
  try {
    await dbConnect();

    // 1. Generate embedding vector for the query
    const queryVector = await getEmbedding(query);

    const retrievalPromises: Promise<RetrievedDocument[]>[] = [];

    // Helper to perform vector search on a model with fallback to text search
    const searchModel = async (
      model: any,
      modelName: string,
      projection: string,
      textFormatter: (doc: any) => string,
      urlGenerator: (doc: any) => string
    ): Promise<RetrievedDocument[]> => {
      try {
        // Run Atlas Vector Search
        // Atlas requires an index named "vector_index" for vector searches
        let results = await model.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 50,
              limit: limitPerModel,
            }
          }
        ]).exec();

        if (!results || results.length === 0) {
          results = await model.find({})
            .limit(limitPerModel)
            .sort({ updatedAt: -1 })
            .lean()
            .exec();
        }

        return results.map((doc: any) => ({
          source: modelName,
          title: doc.title || doc.name || doc.bloodGroup || 'Untitled',
          text: textFormatter(doc),
          url: urlGenerator(doc),
          score: doc.$vectorSearchScore,
        }));
      } catch (vectorSearchError) {
        // Fallback to text search or simple lookup if vector index is not configured yet
        const results = await model.find({})
          .limit(limitPerModel)
          .sort({ updatedAt: -1 })
          .lean()
          .exec();

        return results.map((doc: any) => ({
          source: modelName,
          title: doc.title || doc.name || doc.bloodGroup || 'Untitled',
          text: textFormatter(doc),
          url: urlGenerator(doc),
        }));
      }
    };

    // 2. Queue searches for all indexed models
    retrievalPromises.push(
      searchModel(
        Book,
        'Book',
        'title author category publisher description slug',
        (doc) => `Book: ${doc.title} by ${doc.author || 'Unknown'}. Category: ${(doc.category || []).join(', ')}. Publisher: ${doc.publisher || 'Unknown'}.`,
        (doc) => `/books/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        Course,
        'Course',
        'title description fee mode slug',
        (doc) => `Course: ${doc.title}. Fee: ${doc.fee || 0} BDT. Mode: ${doc.mode || ''}.`,
        (doc) => `/courses/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        Tour,
        'Tour',
        'title destination description budget slug startDate endDate departureLocation status',
        (doc) => `Tour: ${doc.title}. Destination: ${doc.destination}. Start Date: ${doc.startDate ? new Date(doc.startDate).toLocaleDateString() : 'N/A'}. End Date: ${doc.endDate ? new Date(doc.endDate).toLocaleDateString() : 'N/A'}. Departure Location: ${doc.departureLocation || 'N/A'}. Budget: ${doc.budget} BDT. Status: ${doc.status}. Description: ${doc.description}`,
        (doc) => `/tours/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        Post,
        'Post',
        'title content category slug',
        (doc) => `Post: ${doc.title}. Content: ${doc.content}. Category: ${doc.category || 'General'}.`,
        (doc) => `/posts/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        Review,
        'Review',
        'title content rating slug',
        (doc) => `Book Review: ${doc.title}. Content: ${doc.content}. Rating: ${doc.rating || 5}/5.`,
        (doc) => `/reviews/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        BloodDonor,
        'BloodDonor',
        'bloodGroup location willingToTravel notes',
        (doc) => `Blood Donor: Group ${doc.bloodGroup}. Location: ${doc.location}. Willing to travel: ${doc.willingToTravel ? 'Yes' : 'No'}. Notes: ${doc.notes || ''}.`,
        (doc) => `/blood-donors`
      )
    );

    retrievalPromises.push(
      searchModel(
        Product,
        'Product',
        'title description category price condition location slug',
        (doc) => `Marketplace Product: ${doc.title}. Category: ${doc.category}. Price: ${doc.price} BDT. Condition: ${doc.condition}. Location: ${doc.location}.`,
        (doc) => `/marketplace/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        WritingProject,
        'WritingProject',
        'title description category slug',
        (doc) => `Writing Project Book: ${doc.title}. Description: ${doc.description || ''}. Categories: ${(doc.category || []).join(', ')}.`,
        (doc) => `/writing/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        Event,
        'Event',
        'title description eventType location slug startTime status',
        (doc) => `Event: ${doc.title}. Type: ${doc.eventType}. Location: ${doc.location || 'Online'}. Start Time: ${doc.startTime ? new Date(doc.startTime).toLocaleString() : 'N/A'}. Status: ${doc.status}. Description: ${doc.description}.`,
        (doc) => `/events/${doc.slug || doc._id}`
      )
    );

    retrievalPromises.push(
      searchModel(
        User,
        'User',
        'name username bio willingToDonateBlood bloodGroup university location',
        (doc) => `User Profile: ${doc.name} (@${doc.username || ''}). Bio: ${doc.bio || ''}. Blood Group: ${doc.bloodGroup || ''}. University: ${doc.university || ''}. Location: ${doc.location || ''}.`,
        (doc) => `/profile/${doc.username || doc._id}`
      )
    );

    // 3. Resolve all searches and merge results
    const allResultsGroups = await Promise.all(retrievalPromises);
    const mergedResults = allResultsGroups.flat();

    // Direct lookup for phone numbers, emails, or usernames in the query
    const phoneMatch = query.match(/(?:01[3-9]\d{8})|(?:\+8801[3-9]\d{8})/);
    const emailMatch = query.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const usernameMatch = query.match(/@(\w+)/);
    
    let directUserContext = "";
    if (phoneMatch) {
      const phoneNumber = phoneMatch[0];
      const matchedUser = await User.findOne({
        $or: [
          { phone: phoneNumber },
          { whatsappNumber: phoneNumber }
        ]
      }).lean().exec();

      if (matchedUser) {
        directUserContext += `Matched User Profile by Phone Number (${phoneNumber}):\n`;
        directUserContext += `- Name: ${matchedUser.name}\n`;
        directUserContext += `- Username: @${matchedUser.username || ''}\n`;
        directUserContext += `- Email: ${matchedUser.email || 'N/A'}\n`;
        directUserContext += `- Phone: ${matchedUser.phone || 'N/A'}\n`;
        directUserContext += `- WhatsApp: ${matchedUser.whatsappNumber || 'N/A'}\n`;
        directUserContext += `- Blood Group: ${matchedUser.bloodGroup || 'N/A'}\n`;
        directUserContext += `- Location: ${matchedUser.location || 'N/A'}\n`;
        directUserContext += `- Bio: ${matchedUser.bio || 'N/A'}\n\n`;
      }
    }

    if (emailMatch) {
      const emailStr = emailMatch[0].toLowerCase();
      const matchedUser = await User.findOne({ email: emailStr }).lean().exec();

      if (matchedUser) {
        directUserContext += `Matched User Profile by Email (${emailStr}):\n`;
        directUserContext += `- Name: ${matchedUser.name}\n`;
        directUserContext += `- Username: @${matchedUser.username || ''}\n`;
        directUserContext += `- Email: ${matchedUser.email || 'N/A'}\n`;
        directUserContext += `- Phone: ${matchedUser.phone || 'N/A'}\n`;
        directUserContext += `- WhatsApp: ${matchedUser.whatsappNumber || 'N/A'}\n`;
        directUserContext += `- Blood Group: ${matchedUser.bloodGroup || 'N/A'}\n`;
        directUserContext += `- Location: ${matchedUser.location || 'N/A'}\n`;
        directUserContext += `- Bio: ${matchedUser.bio || 'N/A'}\n\n`;
      }
    }

    if (usernameMatch) {
      const usernameStr = usernameMatch[1].toLowerCase();
      const matchedUser = await User.findOne({ username: usernameStr }).lean().exec();

      if (matchedUser) {
        directUserContext += `Matched User Profile by Username (@${usernameStr}):\n`;
        directUserContext += `- Name: ${matchedUser.name}\n`;
        directUserContext += `- Username: @${matchedUser.username || ''}\n`;
        directUserContext += `- Email: ${matchedUser.email || 'N/A'}\n`;
        directUserContext += `- Phone: ${matchedUser.phone || 'N/A'}\n`;
        directUserContext += `- WhatsApp: ${matchedUser.whatsappNumber || 'N/A'}\n`;
        directUserContext += `- Blood Group: ${matchedUser.bloodGroup || 'N/A'}\n`;
        directUserContext += `- Location: ${matchedUser.location || 'N/A'}\n`;
        directUserContext += `- Bio: ${matchedUser.bio || 'N/A'}\n\n`;
      }
    }

    // 4. Format outputs into a context string for the LLM
    let contextString = "Here is the relevant real-time data from Pathchakro's database:\n\n";
    if (directUserContext) {
      contextString += directUserContext;
    }

    // Fetch global library & platform statistics to answer summary/aggregation questions
    const allBooks = await Book.find({}, 'title copies author slug').lean().exec();
    const totalBooksCount = allBooks.length;
    const totalBookCopies = allBooks.reduce((sum, b) => sum + (b.copies || 0), 0);

    const totalDonorsCount = await BloodDonor.countDocuments();
    const totalCoursesCount = await Course.countDocuments();
    const totalToursCount = await Tour.countDocuments();
    const totalProductsCount = await Product.countDocuments();
    const totalEventsCount = await Event.countDocuments();
    const totalWPsCount = await WritingProject.countDocuments();

    contextString += `Global Platform Statistics:\n`;
    contextString += `- Total Unique Books in Pathchakro: ${totalBooksCount} (Total Copies: ${totalBookCopies})\n`;
    contextString += `- Total Blood Donors registered: ${totalDonorsCount}\n`;
    contextString += `- Total Courses available: ${totalCoursesCount}\n`;
    contextString += `- Total Tours planned: ${totalToursCount}\n`;
    contextString += `- Total Products in Marketplace: ${totalProductsCount}\n`;
    contextString += `- Total Events: ${totalEventsCount}\n`;
    contextString += `- Total Writing Projects: ${totalWPsCount}\n\n`;

    contextString += `Complete Book list with copy counts and URLs:\n`;
    allBooks.forEach((book: any) => {
      const bookUrl = `/books/${book.slug || book._id}`;
      contextString += `  * "${book.title}" by ${book.author || 'Unknown'} (${book.copies || 0} copies) - Link: ${bookUrl}\n`;
    });
    contextString += `\n`;

    if (userId) {
      const userLibraryItems = await UserLibrary.find({ user: userId })
        .populate('book', 'title copies')
        .lean()
        .exec();

      if (userLibraryItems && userLibraryItems.length > 0) {
        const totalCopies = userLibraryItems.reduce((sum: number, item: any) => {
          return sum + (item.book?.copies || (item.isOwned ? 1 : 0));
        }, 0);

        contextString += `User's Personal Library Stats:\n`;
        contextString += `- Total Books in Library: ${userLibraryItems.length}\n`;
        contextString += `- Total Copies of Books: ${totalCopies}\n`;
        contextString += `- Book List in Library:\n`;
        userLibraryItems.forEach((item: any) => {
          contextString += `  * "${item.book?.title || 'Unknown'}" (Status: ${item.status}, Owned: ${item.isOwned ? 'Yes' : 'No'}, Copies: ${item.book?.copies || (item.isOwned ? 1 : 0)})\n`;
        });
        contextString += `\n`;
      } else {
        contextString += `User's Personal Library Stats:\n- The user does not have any books in their library currently.\n\n`;
      }
    }

    if (mergedResults.length > 0) {
      mergedResults.forEach((doc, index) => {
        contextString += `[Document ${index + 1}] Source: ${doc.source}\nTitle: ${doc.title}\nContent: ${doc.text}\nURL: https://pathchakro.com${doc.url}\n\n`;
      });
    } else if (contextString.length < 100) {
      return "No matching records found in the database.";
    }

    return contextString;
  } catch (error) {
    console.error("Error retrieving context from RAG:", error);
    return "Error fetching database context.";
  }
}
