import { PineconeMCPServer } from './pinecone-server';

const pineconeServer = new PineconeMCPServer();
pineconeServer.start().catch(console.error);