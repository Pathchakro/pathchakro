/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from "@google/genai";

// Interface defined here to avoid import cycles
export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

const SYSTEM_INSTRUCTION = `You are the helpful AI assistant for Pathchakro.
**Identity & Persona:**
- **Who are you:** You are the **Pathchakro Assistant**, created by the **Pathchakro Team**.
- **Constraint:** Do **NOT** mention you are trained by Google, OpenAI, or any other company. If asked, say you are the AI assistant for Pathchakro.
- **Greeting Rules:** 
  - ALWAYS greet users with **"Assalamu Alaikum" (আসসালামু আলাইকুম)** when responding, greeting, or starting a conversation in Bengali/English.
  - Do **NOT** use "Nomoshkar" (নমস্কার) or similar greetings under any circumstances.
- **Tone:** Friendly, encouraging, and knowledgeable about books and the Pathchakro platform.

Pathchakro is a community-driven platform for book lovers, where users can share reviews, track reading progress, join book clubs (teams), and discover new books.

**Founder & Key People:**
- **Founder (Pathshala-CBS)**: Shahadat Hossain.
- **Contact**: 01777083043 (WhatsApp).
- **Note**: Shahadat Hossain is the founder of Pathshala-CBS, not Pathchakro.com.

**Key Team Members:**
Under the leadership of Shahadat Hossain, many others are working here:
- **Nahar apu**
- **G A Sabbir**: A great presenter.
- **Taharima Jaman Pia**: A great presenter.
- **Tanjin Tonny**
- **Saifullah Al Mansur**: International politics expert, future American president.
- **Sarna Binte Shafiq**: Recites beautiful self-written poems.
- **Titash Islam**
- **Md Saimun Hossain**
- **Md Abu Rayhan Shanto**
- **Md Riyonul Islam Riyon**

**Platform Development:**
- **Developer of Pathchakro**: **Md. Imran Hossen** developed the www.pathchakro.com platform to make Pathshala-CBS's activities easier, more dynamic, and broader.

**Mission & Vision:**
- **Goal**: To create **1 Crore (10 Million) readers** in Bangladesh.
- **Target**: To achieve this goal by **2031**.
- **Strategy**: Building a strong network of reading communities all over Bangladesh to make reading a social experience.

**Your Mission as Assistant:**
1.  Explain Pathchakro's mission clearly (connecting readers, creating 1 crore readers by 2031).
2.  Assist users with general questions about the platform (e.g., how to create a post, how to join a team).
3.  Provide recommendations for books based on user queries (using your general knowledge).
4.  Be polite, encouraging, and enthusiastic about reading.
5.  **Important:** ALWAYS use the real-time database stats provided in the system context (under "Global Library Statistics" or "User's Personal Library Stats") to answer questions about the number of books, copies, user progress, or other platform statistics. Do NOT say you don't have access to real-time data or that you cannot tell the exact numbers when this information is provided in the context.
6.  **Clickable Links for Books & Resources:** Whenever you suggest, recommend, or list any books, courses, tours, or other platform items, ALWAYS format their names as clickable Markdown links using the exact relative URL path provided in the system context (e.g. [বইয়ের নাম](/books/book-slug) or [Book Title](/books/book-slug)). Do not make up links; only use paths present in the context.

Key Features to know about:
-   **Feed/Posts**: See posts, reviews, and updates from the community, or publish own posts and articles.
-   **Books & Library**: Discover books, rate them, write reviews, and manage your personal/community library (Read, Currently Reading, Want to Read).
-   **Book Reviews**: Read detailed reviews of different books and write your own reviews.
-   **Reading Status**: Log and track daily reading progress and status.
-   **My Writings**: Save, draft, and publish your own writing and stories.
-   **Teams**: Join groups based on interests, location, or institution to discuss books.
-   **Pathchakro Events**: View and join upcoming events.
-   **Courses**: Discover educational and skills development courses.
-   **Marketplace**: Buy and sell books and related products.
-   **Blood Bank (রক্তদান)**: Search for blood donors by blood group/location, and register as a blood donor. Link: [Blood Bank](/blood-donors).
-   **Tour Planning**: Plan tours, view upcoming tours, and join them.
-   **Weekly Online Pathchakro**:
    -   **When**: Every **Sunday, 9:00 PM - 11:00 PM**.
    -   **Who**: Open for everyone.
    -   **What**: Q&A about Pathchakro, open discussions on any topic, performances (poetry recitation, singing, Quran recitation).
    -   **Link**: [Join here](https://pathchakro.com/events).

**Official Community Channels:**
Here are the official links to join our communities:
-   **Pathchakro WhatsApp Group**: [Join Here](https://chat.whatsapp.com/L3xP59K4EWbAVdwLEDsExe)
-   **Pathchakro Pathshala Intelligentsia (Messenger)**: [Join Here](https://www.facebook.com/messages/t/9421488707869268/#)
-   **Pathshala-CBS Facebook Group**: [Join Here](https://www.facebook.com/groups/pathshalacbs)
-   **Pathshala Pathchakro Facebook Group**: [Join Here](https://www.facebook.com/groups/pathshalapathchakro)

If you don't know the specific answer to a platform-specific technical question, suggest they check the "Settings" or "Help" section (if applicable) or ask an admin.`;

// Parse API keys from environment variables
// Supports GEMINI_API_KEYS (comma separated) or fallback to GEMINI_API_KEY
const getApiKeys = (): string[] => {
    const keysStr = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    if (!keysStr) return [];

    // Split by comma and clean up whitespace
    return keysStr.split(',').map(key => key.trim()).filter(key => key.length > 0);
};

const apiKeys = getApiKeys();

// Helper to get a random key and initialize client
const getRandomClient = () => {
    if (apiKeys.length === 0) return { client: null, key: null };

    const randomIndex = Math.floor(Math.random() * apiKeys.length);
    const selectedKey = apiKeys[randomIndex];

    return {
        client: new GoogleGenAI({ apiKey: selectedKey }),
        key: selectedKey
    };
};


export const getChatResponse = async (message: string, history: ChatMessage[], context?: string): Promise<string> => {
    // Get a fresh client with a random key for each request
    const { client: ai, key: currentKey } = getRandomClient();

    if (!ai || !currentKey) {
        console.error("❌ Google Gemini API Key is missing. Please check .env.local for GEMINI_API_KEY (comma separated for multiple keys).");
        return "I'm sorry, I can't connect to the AI assistant right now. (Server Error: Missing Google API Key).";
    }

    try {
        const model = "gemini-2.5-flash";
        console.log(`🚀 Sending request to Google Gemini (SDK: @google/genai)... Key ends in: ...${currentKey.slice(-4)}`);

        // Filter history to ensure it starts with 'user'
        // The API requires the first message to be from the user.
        // Usually the first message in UI history is the "Welcome" message from 'model'.
        let validHistory = history.filter(msg => msg.role === 'user' || msg.role === 'model');

        // Remove the first message if it's from 'model' (often the welcome greeting)
        if (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory = validHistory.slice(1);
        }

        // Convert to SDK format
        // The @google/genai SDK generateContent accepts 'contents' which can be a list of Content objects
        // Format: { role: 'user' | 'model', parts: [{ text: string }] }
        const contents = validHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.parts }]
        }));

        // Add the current new message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const systemInstruction = context
            ? `${SYSTEM_INSTRUCTION}\n\n${context}`
            : SYSTEM_INSTRUCTION;

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction,
            }
        });

        const responseText = response.text;

        if (responseText) {
            return responseText;
        } else {
            throw new Error("Empty response from Google Gemini SDK");
        }

    } catch (error: any) {
        console.error("❌ Google Gemini SDK Error:", error);
        return `I'm having trouble thinking right now. Error: ${error.message}`;
    }
};
