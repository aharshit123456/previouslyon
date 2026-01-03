import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// specific model can be changed here
export const geminiModel = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
        responseMimeType: "application/json",
    }
});
