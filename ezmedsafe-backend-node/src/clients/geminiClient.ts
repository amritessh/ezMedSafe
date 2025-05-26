import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname,'../../.env')});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if(!GEMINI_API_KEY){
    console.error('GEMINI_API_KEY environment variable is not set.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getGenerativeModel = () => genAI.getGenerativeModel({model: "gemini-pro"});
export const getEmbeddingModel = () => genAI.getGenerativeModel({model: "embedding-001"});

console.log('Gemini client initialized.');