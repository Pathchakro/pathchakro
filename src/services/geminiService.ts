/* eslint-disable @typescript-eslint/no-explicit-any */

// Interface defined here to avoid import cycles
export interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

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
- **G A Sabbir**
- **Taharima Jaman Pia**
- **Tanjin Tonny**
- **Saifullah Al Mansur**
- **Sarna Binte Shafiq**
- **Titash Islam**
- **Md Saimun Hossain**
- **Md Abu Rayhan Shanto**
- **Md Riyonul Islam Riyon**

**Platform Development:**
- **Md. Imran Hossen** took the initiative to build this platform.

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

If you don't know the specific answer to a platform-specific technical question, suggest they check the "Settings" or "Help" section (if applicable) or ask an admin.`;

const MODELS = [
    "google/gemini-2.0-flash-exp:free",       // Primary: Best for Bengali/English mix
    "z-ai/glm-4.5-air:free",                  // Backup: User recommended, reliable
    "google/gemini-2.0-flash-thinking-exp:free", // Backup: Reasoning
    "meta-llama/llama-3.3-70b-instruct:free", // Backup: High performance
    "mistralai/mistral-7b-instruct:free",     // Backup: Reliable
    "google/gemini-flash-1.5-8b",             // Backup: Fast but weak on Bengali
    "microsoft/phi-3-medium-128k-instruct:free", // Backup: Context
    "meta-llama/llama-3-8b-instruct:free"     // Backup: Fallback
];

const googleApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Function to call Google's Gemini API directly
const callGoogleGemini = async (message: string, history: ChatMessage[]) => {
    if (!googleApiKey) return null;

    try {
        console.log("Attempting direct Google Gemini API call...");
        // Convert history to Google's format
        const googleContents = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.parts }]
        }));

        // Add system instruction as the first part if supported, or prepend to first message
        // For simplicity with this endpoint, we'll strict structure or Just use the user message + history
        // Google v1beta/models/gemini-pro:generateContent

        // Proper structure for Gemini 1.5/2.0
        const contents = [
            ...googleContents,
            { role: 'user', parts: [{ text: message }] }
        ];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn("Direct Google API failed:", response.status, errorText);
            throw new Error(`Google API Error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) return text;
        throw new Error("No text in Google response");

    } catch (error) {
        console.warn("Direct Google Gemini call failed, falling back to OpenRouter...", error);
        return null;
    }
};

export const getChatResponse = async (message: string, history: ChatMessage[]): Promise<string> => {
    // 1. Try Direct Google Gemini Key first
    const googleResponse = await callGoogleGemini(message, history);
    if (googleResponse) {
        return googleResponse;
    }

    // 2. Fallback to OpenRouter
    if (!apiKey) {
        return "I'm sorry, but I can't connect to the AI assistant right now (Missing API Keys).";
    }

    // Construct messages for OpenAI format
    const messages: any[] = [
        { role: 'system', content: SYSTEM_INSTRUCTION }
    ];

    history.forEach(msg => {
        messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.parts
        });
    });

    messages.push({ role: 'user', content: message });

    let lastError: any = null;

    for (const model of MODELS) {
        try {
            console.log(`Sending request to OpenRouter (Model: ${model})...`);

            // Using raw fetch for better error visibility than the SDK
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": "https://pathchakro.com",
                    "X-Title": "Pathchakro",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": model,
                    "messages": messages,
                    "stream": false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.warn(`OpenRouter Rate Limit/Error (${model}):`, response.status); // Reduced noise
                // Throw to catch block to try next model
                throw new Error(`Status ${response.status}: ${JSON.stringify(errorData) || response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (content) {
                return content;
            } else {
                throw new Error("Empty response content from OpenRouter");
            }

        } catch (error: any) {
            console.warn(`Fallback: Failed with model ${model}, trying next in 2s...`); // Warn instead of Error
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s to clear rate limits
        }
    }

    // If we get here, all models failed
    console.error("All AI models failed.");
    return `I'm currently receiving high traffic. Please try again in 30 seconds. (All models busy)`;
};
