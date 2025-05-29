import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname,'../../.env')});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
    // environment: process.env.PINECONE_ENVIRONMENT || '',
});

async function verifyPineconeConnection(){
    try{
        const indexName = process.env.PINECONE_INDEX_NAME || 'ezmedsafe-rag-index';
        await pinecone.describeIndex(indexName);
        console.log(`Pinecone index '${indexName}' connected successfully`);
    } catch(error){
        console.error('Pinecone connection failed:', error);
    }
}

verifyPineconeConnection();

export const getPineconeIndex = async()=>{
    const indexName = process.env.PINECONE_INDEX_NAME || 'ezmedsafe-rag-index';
    return pinecone.index(indexName);
};