import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export class PineconeMCPServer {
    private server: Server;
  
    constructor() {
      this.server = new Server(
        {
          name: "pinecone-evidence-server", 
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
  
      this.setupToolHandlers();
    }
  
    private setupToolHandlers() {
      this.server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
          tools: [
            {
              name: "retrieve_evidence",
              description: "Retrieve evidence-based text snippets from Pinecone vector database using semantic search",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Natural language query for retrieving relevant evidence"
                  },
                  topK: {
                    type: "number",
                    description: "Number of top results to return",
                    default: 3
                  }
                },
                required: ["query"]
              }
            }
          ]
        };
      });
  
      this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
  
        if (name === "retrieve_evidence") {
          if (!args || typeof args.query !== 'string') {
            throw new Error("Invalid arguments: query must be a string");
          }
          const topK = typeof args.topK === 'number' ? args.topK : 3;
          return await this.retrieveEvidence(args.query, topK);
        }
  
        throw new Error(`Unknown tool: ${name}`);
      });
    }
  
    private async retrieveEvidence(query: string, topK: number) {
      try {
        // Import here to avoid circular dependencies
        const { getEmbeddingModel } = await import("../clients/geminiClient");
        const { getPineconeIndex } = await import("../clients/pineconeClient");
  
        // Generate embedding
        const embeddingResponse = await getEmbeddingModel().embedQuery(query);
        const queryEmbedding = embeddingResponse;
  
        if (!queryEmbedding) {
          throw new Error("Failed to generate embedding for the query");
        }
  
        // Query Pinecone
        const pineconeIndex = await getPineconeIndex();
        const queryResult = await pineconeIndex.query({
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true,
        });
  
        const relevantTexts: string[] = [];
        if (queryResult.matches) {
          for (const match of queryResult.matches) {
            if (match.metadata && match.metadata.text) {
              relevantTexts.push(match.metadata.text as string);
            }
          }
        }
  
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: relevantTexts,
                query: query,
                resultsCount: relevantTexts.length,
                source: "pinecone_vector_db"
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                source: "pinecone_vector_db"
              })
            }
          ]
        };
      }
    }
  
    async start() {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log("Pinecone MCP Server running on stdio");
    }
  }