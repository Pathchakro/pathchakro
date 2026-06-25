import { GoogleGenAI } from "@google/genai";

const getApiKey = (): string => {
  const keysStr = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!keysStr) return "";
  // Return the first key if comma-separated
  return keysStr.split(',')[0].trim();
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates a 768-dimensional vector embedding for the given text.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty for embedding generation.");
  }

  if (!ai) {
    throw new Error("Google Gemini API Key is missing. Check GEMINI_API_KEY in environment variables.");
  }

  try {
    const cleanText = text.replace(/\n/g, " ").trim();
    const response = await ai.models.embedContent({
      model: "gemini-embedding-2",
      contents: cleanText,
      config: {
        outputDimensionality: 768,
      },
    });

    if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
      return response.embeddings[0].values;
    } else {
      throw new Error("Failed to retrieve embedding values from Gemini API response.");
    }
  } catch (error: any) {
    console.error("Error generating vector embedding:", error);
    throw error;
  }
}
