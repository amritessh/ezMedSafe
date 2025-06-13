// ezmedsafe-backend-node/src/clients/geminiClient.ts
import { GoogleGenerativeAI } from "@google/generative-ai"; // Keep if needed for embeddings or other direct uses
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; // Import LangChain's Gemini chat model
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; // For embedding model
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname,'../../.env')});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if(!GEMINI_API_KEY){
    console.error('GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
}

// Function to get a LangChain-wrapped Generative Model (for chat/generation)
export const getGenerativeModel = () => {
    return new ChatGoogleGenerativeAI({
        apiKey: GEMINI_API_KEY,
        model: "gemini-pro",
        temperature: 0.1, // Adjust as needed
    });
};

// Function to get a LangChain-wrapped Embedding Model
export const getEmbeddingModel = () => {
    return new GoogleGenerativeAIEmbeddings({
        apiKey: GEMINI_API_KEY,
        model: "embedding-001",
    });
};

console.log('Gemini client (LangChain-wrapped) initialized.');