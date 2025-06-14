import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import driver from "../clients/neo4jClient";
import { PatientContextInput } from "../types";

export class Neo4jMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "neo4j-ddi-server",
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "query_drug_interactions",
            description: "Query Neo4j knowledge graph for drug-drug interactions, mechanisms, and patient-specific risks",
            inputSchema: {
              type: "object",
              properties: {
                medications: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of medication names to check for interactions"
                },
                patientContext: {
                  type: "object",
                  properties: {
                    age_group: { type: "string", enum: ["Pediatric", "Adult", "Elderly"] },
                    renal_status: { type: "boolean" },
                    hepatic_status: { type: "boolean" },
                    cardiac_status: { type: "boolean" }
                  },
                  description: "Patient context for personalized interaction checking"
                }
              },
              required: ["medications"]
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "query_drug_interactions") {
        if (!args || !Array.isArray(args.medications)) {
          throw new Error("Invalid arguments: medications must be an array");
        }
        return await this.queryDrugInteractions(args.medications, args.patientContext as PatientContextInput);
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  private async queryDrugInteractions(medications: string[], patientContext?: PatientContextInput) {
    const session = driver.session();
    
    try {
      const medicationNamesLower = medications.map(name => name.toLowerCase());
      
      const query = `
        UNWIND $medNames AS drugName1
        UNWIND $medNames AS drugName2
        MATCH (d1:Drug) WHERE toLower(d1.name) = drugName1
        MATCH (d2:Drug) WHERE toLower(d2.name) = drugName2
        MATCH (d1)-[r:INTERACTS_WITH]->(d2)
        WHERE d1.name <> d2.name
        
        OPTIONAL MATCH (d1)-[:INCREASES_RISK_OF]->(c1:ClinicalConsequence)
        OPTIONAL MATCH (d2)-[:INCREASES_RISK_OF]->(c2:ClinicalConsequence)
        OPTIONAL MATCH (d1)-[:EXACERBATED_BY]->(pc1:PatientCharacteristic)
        OPTIONAL MATCH (d2)-[:EXACERBATED_BY]->(pc2:PatientCharacteristic)
        
        RETURN d1.name AS drugA, d2.name AS drugB, 
               r.mechanism AS mechanism, r.notes AS interactionNotes,
               COLLECT(DISTINCT c1.name) + COLLECT(DISTINCT c2.name) AS clinicalConsequences,
               COLLECT(DISTINCT pc1.name) + COLLECT(DISTINCT pc2.name) AS allExacerbatingFactors
      `;

      const result = await session.run(query, { medNames: medicationNamesLower });
      
      const interactions = result.records.map(record => {
        const allFactors = record.get('allExacerbatingFactors') || [];
        
        // Filter factors based on patient context
        let relevantFactors: string[] = [];
        if (patientContext) {
          if (patientContext.renal_status && allFactors.includes('Renal Impairment')) {
            relevantFactors.push('Renal Impairment');
          }
          if (patientContext.hepatic_status && allFactors.includes('Hepatic Impairment')) {
            relevantFactors.push('Hepatic Impairment');
          }
          if (patientContext.cardiac_status && allFactors.includes('Cardiac Disease')) {
            relevantFactors.push('Cardiac Disease');
          }
        }

        return {
          drugA: record.get('drugA'),
          drugB: record.get('drugB'),
          mechanism: record.get('mechanism'),
          interactionNotes: record.get('interactionNotes'),
          clinicalConsequences: record.get('clinicalConsequences'),
          exacerbatedByCharacteristics: relevantFactors
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              data: interactions,
              source: "neo4j_knowledge_graph"
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
              source: "neo4j_knowledge_graph"
            })
          }
        ]
      };
    } finally {
      await session.close();
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Neo4j MCP Server running on stdio");
  }
}