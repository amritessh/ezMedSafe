import { getEmbeddingModel } from "../clients/geminiClient";
import { getPineconeIndex } from "../clients/pineconeClient";

export class ERAAgent {
  constructor() {
    console.log("ERAAgent initialized");
  }

  async retrieveEvidence(query: string, topK: number = 3): Promise<string[]> {
    try {
      // 1. Generate embedding for the query using Gemini
      const embeddingResponse = await getEmbeddingModel().embedContent(query);
      const queryEmbedding = embeddingResponse.embedding.values;

      if (!queryEmbedding) {
        throw new Error("Failed to generate embedding for the query.");
      }

      // 2. Perform vector similarity search on Pinecone
      const pineconeIndex = await getPineconeIndex();
      const queryResult = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
      });

      // 3. Extract relevant text snippets
      const relevantTexts: string[] = [];
      if (queryResult.matches) {
        for (const match of queryResult.matches) {
          if (match.metadata && match.metadata.text) {
            relevantTexts.push(match.metadata.text as string);
          }
        }
      }
      console.log(`Retrieved <span class="math-inline">\{relevantTexts\.length\} evidence snippets for query\: "</span>{query}"`);
      return relevantTexts;
    } catch (error) {
      console.error('Error in ERAAgent.retrieveEvidence:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }
}