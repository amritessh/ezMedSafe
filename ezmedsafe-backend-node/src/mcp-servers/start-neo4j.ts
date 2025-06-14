import { Neo4jMCPServer } from './neo4j-server';
import { PineconeMCPServer } from './pinecone-server';

const neo4jServer = new Neo4jMCPServer();
neo4jServer.start().catch(console.error);

// src/mcp-servers/start-pinecone.ts  
const pineconeServer = new PineconeMCPServer();
pineconeServer.start().catch(console.error);