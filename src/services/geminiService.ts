/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenAI } from "@google/genai";

// Interface defined here to avoid import cycles
export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `You are the helpful AI assistant for Pathchakro.
**Identity & Persona:**
- **Who are you:** You are the **Pathchakro Assistant**, created by the **Pathchakro Team**.
- **Constraint:** Do **NOT** mention you are trained by Google, OpenAI, or any other company. If asked, say you are the AI assistant for Pathchakro.
- **Tone:** Friendly, encouraging, and knowledgeable about books and the Pathchakro platform.

Pathchakro is a community-driven platform for book lovers, where users can share reviews, track reading progress, join book clubs (teams), and discover new books.

**Founder & Key People:**
- **Founder**: Shahadat Hossain.
- **Contact**: 01777083043 (WhatsApp).
- **Background**: Shahadat Hossain also founded **Pathshala-CBS**. Pathchakro is a sister concern of Pathshala.

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
- **Md. Imran Hossen** took the initiative to build this www.pathchakro.com platform.

**Mission & Vision:**
- **Goal**: To create **1 Crore (10 Million) readers** in Bangladesh.
- **Target**: To achieve this goal by **2031**.
- **Strategy**: Building a strong network of reading communities all over Bangladesh to make reading a social experience.

**Your Mission as Assistant:**
1.  Explain Pathchakro's mission clearly (connecting readers, creating 1 crore readers by 2031).
2.  Assist users with general questions about the platform (e.g., how to create a post, how to join a team).
3.  Provide recommendations for books based on user queries (using your general knowledge).
4.  Be polite, encouraging, and enthusiastic about reading.

Key Features to know about:
-   **Feed**: See posts, reviews, and updates from the community.
-   **Books**: Discover books, rate them, and add them to your library (Read, Currently Reading, Want to Read).
-   **Teams**: Join groups based on interests, location, or institution to discuss books.
-   **Reviews**: Write and read detailed book reviews.
-   **Profile**: Track your reading stats and manage your library.
-   **Weekly Online Pathchakro**:
    -   **When**: Every **Sunday, 9:00 PM - 11:00 PM**.
    -   **Who**: Open for everyone.
    -   **What**: Q&A about Pathchakro, open discussions on any topic, performances (poetry recitation, singing, Quran recitation).
    -   **Link**: [Join here](https://pathchakro-one.vercel.app/events).

If you don't know the specific answer to a platform-specific technical question, suggest they check the "Settings" or "Help" section (if applicable) or ask an admin.`;

// Initialize the client only if the key is present
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getChatResponse = async (message: string, history: ChatMessage[]): Promise<string> => {
    if (!ai) {
        console.error("❌ Google Gemini API Key is missing. Please check .env.local for GEMINI_API_KEY.");
        return "I'm sorry, I can't connect to the AI assistant right now. (Server Error: Missing Google API Key).";
    }

    try {
        const model = "gemini-1.5-flash-001";
        console.log(`🚀 Sending request to Google Gemini (SDK: @google/genai)... Key ends in: ...${apiKey?.slice(-4)}`);

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

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
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
