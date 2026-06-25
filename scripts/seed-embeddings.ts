import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

// Load env variables
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let mongoUri = '';
let geminiApiKey = '';

envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0]) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (key === 'MONGODB_URI') mongoUri = val;
    if (key === 'GEMINI_API_KEY' || key === 'NEXT_PUBLIC_GEMINI_API_KEY') geminiApiKey = val;
  }
});

if (!mongoUri) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}

const apiKey = geminiApiKey.split(',')[0].trim();
if (!apiKey) {
  console.error('GEMINI_API_KEY not found');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Helper to generate embedding
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const cleanText = text.replace(/\n/g, ' ').trim();
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: cleanText,
      config: {
        outputDimensionality: 768,
      },
    });
    if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
      return response.embeddings[0].values;
    }
    throw new Error('No embedding values returned');
  } catch (error) {
    console.error(`Error embedding text: "${text.substring(0, 40)}..."`, error);
    throw error;
  }
}

// Minimal schemas for seeding
const Book = mongoose.models.Book || mongoose.model('Book', new mongoose.Schema({ title: String, author: String, category: [String], publisher: String, embedding: [Number] }));
const Course = mongoose.models.Course || mongoose.model('Course', new mongoose.Schema({ title: String, description: String, fee: Number, mode: String, embedding: [Number] }));
const Tour = mongoose.models.Tour || mongoose.model('Tour', new mongoose.Schema({ title: String, destination: String, description: String, budget: Number, itinerary: mongoose.Schema.Types.Mixed, embedding: [Number] }));
const Post = mongoose.models.Post || mongoose.model('Post', new mongoose.Schema({ title: String, content: String, category: String, embedding: [Number] }));
const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({ title: String, content: String, rating: Number, embedding: [Number] }));
const BloodDonor = mongoose.models.BloodDonor || mongoose.model('BloodDonor', new mongoose.Schema({ bloodGroup: String, location: String, willingToTravel: Boolean, notes: String, embedding: [Number] }));
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({ title: String, description: String, category: String, price: Number, condition: String, location: String, embedding: [Number] }));
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({ status: String, totalPrice: Number, quantity: Number, deliveryAddress: String, embedding: [Number] }));
const WritingProject = mongoose.models.WritingProject || mongoose.model('WritingProject', new mongoose.Schema({ title: String, description: String, category: [String], embedding: [Number] }));
const Event = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({ title: String, description: String, eventType: String, location: String, embedding: [Number] }));
const Author = mongoose.models.Author || mongoose.model('Author', new mongoose.Schema({ name: String, bio: String, embedding: [Number] }));
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({ name: String, username: String, bio: String, willingToDonateBlood: Boolean, bloodGroup: String, university: String, location: String, embedding: [Number] }));

import dns from 'dns';

async function seedEmbeddings() {
  try {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      console.warn('Failed to set DNS servers inside seedEmbeddings:', e);
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Books
    const books = await Book.find({ embedding: { $exists: false } });
    console.log(`Found ${books.length} books to embed.`);
    for (const book of books) {
      const text = `Book: ${book.title} by ${book.author || 'Unknown'}. Category: ${(book.category || []).join(', ')}. Publisher: ${book.publisher || 'Unknown'}.`;
      book.embedding = await getEmbedding(text);
      await book.save();
    }

    // 2. Courses
    const courses = await Course.find({ embedding: { $exists: false } });
    console.log(`Found ${courses.length} courses to embed.`);
    for (const course of courses) {
      const text = `Course: ${course.title}. Description: ${course.description || ''}. Fee: ${course.fee || 0} BDT. Mode: ${course.mode || ''}.`;
      course.embedding = await getEmbedding(text);
      await course.save();
    }

    // 3. Tours
    const tours = await Tour.find({ embedding: { $exists: false } });
    console.log(`Found ${tours.length} tours to embed.`);
    for (const tour of tours) {
      const text = `Tour: ${tour.title}. Destination: ${tour.destination}. Description: ${tour.description}. Budget: ${tour.budget} BDT.`;
      tour.embedding = await getEmbedding(text);
      await tour.save();
    }

    // 4. Posts
    const posts = await Post.find({ embedding: { $exists: false } });
    console.log(`Found ${posts.length} posts to embed.`);
    for (const post of posts) {
      const text = `Post: ${post.title}. Content: ${post.content}. Category: ${post.category || 'General'}.`;
      post.embedding = await getEmbedding(text);
      await post.save();
    }

    // 5. Reviews
    const reviews = await Review.find({ embedding: { $exists: false } });
    console.log(`Found ${reviews.length} reviews to embed.`);
    for (const review of reviews) {
      const text = `Book Review: ${review.title}. Content: ${review.content}. Rating: ${review.rating || 5}/5.`;
      review.embedding = await getEmbedding(text);
      await review.save();
    }

    // 6. Blood Donors
    const donors = await BloodDonor.find({ embedding: { $exists: false } });
    console.log(`Found ${donors.length} blood donors to embed.`);
    for (const donor of donors) {
      const text = `Blood Donor: Group ${donor.bloodGroup}. Location: ${donor.location}. Willing to travel: ${donor.willingToTravel ? 'Yes' : 'No'}. Notes: ${donor.notes || ''}.`;
      donor.embedding = await getEmbedding(text);
      await donor.save();
    }

    // 7. Products
    const products = await Product.find({ embedding: { $exists: false } });
    console.log(`Found ${products.length} products to embed.`);
    for (const product of products) {
      const text = `Marketplace Product: ${product.title}. Category: ${product.category}. Price: ${product.price} BDT. Condition: ${product.condition}. Location: ${product.location}. Description: ${product.description}.`;
      product.embedding = await getEmbedding(text);
      await product.save();
    }

    // 8. Orders
    const orders = await Order.find({ embedding: { $exists: false } });
    console.log(`Found ${orders.length} orders to embed.`);
    for (const order of orders) {
      const text = `Order: Status ${order.status}. Total Price: ${order.totalPrice} BDT. Quantity: ${order.quantity}. Delivery Address: ${order.deliveryAddress}.`;
      order.embedding = await getEmbedding(text);
      await order.save();
    }

    // 9. Writing Projects
    const writingProjects = await WritingProject.find({ embedding: { $exists: false } });
    console.log(`Found ${writingProjects.length} writing projects to embed.`);
    for (const wp of writingProjects) {
      const text = `Writing Project Book: ${wp.title}. Description: ${wp.description || ''}. Categories: ${(wp.category || []).join(', ')}.`;
      wp.embedding = await getEmbedding(text);
      await wp.save();
    }

    // 10. Events
    const events = await Event.find({ embedding: { $exists: false } });
    console.log(`Found ${events.length} events to embed.`);
    for (const event of events) {
      const text = `Event: ${event.title}. Type: ${event.eventType}. Location: ${event.location || 'Online'}. Description: ${event.description}.`;
      event.embedding = await getEmbedding(text);
      await event.save();
    }

    // 11. Authors
    const authors = await Author.find({ embedding: { $exists: false } });
    console.log(`Found ${authors.length} authors to embed.`);
    for (const author of authors) {
      const text = `Author profile: ${author.name}. Biography: ${author.bio || ''}.`;
      author.embedding = await getEmbedding(text);
      await author.save();
    }

    // 12. Users
    const users = await User.find({ embedding: { $exists: false } });
    console.log(`Found ${users.length} users to embed.`);
    for (const user of users) {
      const text = `User profile: ${user.name} (@${user.username || ''}). Bio: ${user.bio || ''}. Blood Group: ${user.bloodGroup || ''}. Willing to donate: ${user.willingToDonateBlood ? 'Yes' : 'No'}. University: ${user.university || ''}. Location: ${user.location || ''}.`;
      user.embedding = await getEmbedding(text);
      await user.save();
    }

    console.log('✅ Embedding seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding embeddings:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedEmbeddings();
