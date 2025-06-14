import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getGenerativeModel } from "../clients/geminiClient";
import { DDIAlert, PatientContextInput } from "../types";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export class MCPEnabledEGAAgent {
  private llm: ChatGoogleGenerativeAI;
  private neo4jClient: Client | null = null;
  private pineconeClient: Client | null = null;

  constructor() {
    this.llm = getGenerativeModel();
    this.initializeMCPClients();
  }

  private async initializeMCPClients() {
    try {
      // Initialize Neo4j MCP Client
      const neo4jTransport = new StdioClientTransport({
        command: "node",
        args: ["dist/mcp-servers/neo4j-server.js"]
      });
      
      this.neo4jClient = new Client(
        {
          name: "ega-agent-neo4j-client",
          version: "1.0.0",
        },
        {
          capabilities: {}
        }
      );
      
      await this.neo4jClient.connect(neo4jTransport);

      // Initialize Pinecone MCP Client  
      const pineconeTransport = new StdioClientTransport({
        command: "node", 
        args: ["dist/mcp-servers/pinecone-server.js"]
      });
      
      this.pineconeClient = new Client(
        {
          name: "ega-agent-pinecone-client",
          version: "1.0.0",
        },
        {
          capabilities: {}
        }
      );
      
      await this.pineconeClient.connect(pineconeTransport);

      console.log("MCP clients initialized successfully");
    } catch (error) {
      console.error("Failed to initialize MCP clients:", error);
    }
  }

  async generateDDIAlert(
    patientContext: PatientContextInput,
    allMedicationNames: string[]
  ): Promise<DDIAlert> {
    try {
      // Step 1: Query Neo4j for drug interactions via MCP
      const kgResults = await this.queryKnowledgeGraph(allMedicationNames, patientContext);
      
      // Step 2: Retrieve evidence from Pinecone via MCP
      const evidenceResults = await this.retrieveEvidence(kgResults, allMedicationNames);
      
      // Step 3: Generate final alert using LLM with gathered context
      const alert = await this.synthesizeAlert(kgResults, evidenceResults, patientContext, allMedicationNames);
      
      return alert;
    } catch (error) {
      console.error("Error generating DDI alert:", error);
      return this.getErrorAlert(allMedicationNames);
    }
  }

  private async queryKnowledgeGraph(medications: string[], patientContext: PatientContextInput) {
    if (!this.neo4jClient) {
      throw new Error("Neo4j MCP client not initialized");
    }

    const result = (await this.neo4jClient.request({
      method: "tools/call",
      params: {
        name: "query_drug_interactions",
        arguments: {
          medications,
          patientContext
        }
      }
    }, CallToolRequestSchema)) as unknown as { content: Array<{ type: string; text: string }> };

    const content = result.content[0];
    if (content.type === "text") {
      return JSON.parse(content.text);
    }
    throw new Error("Invalid response from Neo4j MCP server");
  }

  private async retrieveEvidence(kgResults: any, medications: string[]) {
    if (!this.pineconeClient) {
      throw new Error("Pinecone MCP client not initialized");
    }

    let evidenceQuery = "";
    if (kgResults.success && kgResults.data.length > 0) {
      const interaction = kgResults.data[0];
      evidenceQuery = `Drug interaction between ${interaction.drugA} and ${interaction.drugB} mechanism: ${interaction.mechanism}`;
    } else {
      evidenceQuery = `Drug interactions involving ${medications.join(", ")}`;
    }

    const result = (await this.pineconeClient.request({
      method: "tools/call",
      params: {
        name: "retrieve_evidence", 
        arguments: {
          query: evidenceQuery,
          topK: 3
        }
      }
    }, CallToolRequestSchema)) as unknown as { content: Array<{ type: string; text: string }> };

    const content = result.content[0];
    if (content.type === "text") {
      return JSON.parse(content.text);
    }
    throw new Error("Invalid response from Pinecone MCP server");
  }

  private async synthesizeAlert(
    kgResults: any,
    evidenceResults: any, 
    patientContext: PatientContextInput,
    medications: string[]
  ): Promise<DDIAlert> {
    const systemPrompt = `You are an expert clinical pharmacologist. Based on the provided knowledge graph data and evidence, generate a DDI alert in JSON format following this interface:

interface DDIAlert {
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  drugA: string;
  drugB: string;
  explanation: string;
  clinicalImplication: string;
  recommendation: string;
}`;

    const contextPrompt = `
Knowledge Graph Results: ${JSON.stringify(kgResults, null, 2)}

Evidence Retrieved: ${JSON.stringify(evidenceResults, null, 2)}

Patient Context: ${JSON.stringify(patientContext, null, 2)}

Medications: ${medications.join(", ")}

Generate a comprehensive DDI alert based on this information.`;

    const response = await this.llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: contextPrompt }
    ]);

    // Parse the response
    let jsonString = response.content.toString().trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7, jsonString.lastIndexOf('```')).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3, jsonString.lastIndexOf('```')).trim();
    }

    const alert: DDIAlert = JSON.parse(jsonString);
    
    // Ensure required fields are populated
    alert.drugA = alert.drugA || medications[0] || 'N/A';
    alert.drugB = alert.drugB || medications[1] || 'N/A';

    return alert;
  }

  private getErrorAlert(medications: string[]): DDIAlert {
    return {
      severity: 'Critical',
      drugA: medications[0] || 'UNKNOWN',
      drugB: medications[1] || 'UNKNOWN', 
      explanation: 'Failed to generate detailed alert due to system error.',
      clinicalImplication: 'Automated alert unavailable. Manual clinical review required.',
      recommendation: 'Verify system status and conduct manual drug interaction review immediately.'
    };
  }

  async cleanup() {
    if (this.neo4jClient) {
      await this.neo4jClient.close();
    }
    if (this.pineconeClient) {
      await this.pineconeClient.close();
    }
  }
}
