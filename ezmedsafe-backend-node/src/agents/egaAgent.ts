// ezmedsafe-backend-node/src/agents/egaAgent.ts
import { getGenerativeModel } from "../clients/geminiClient"; // Now returns LangChain ChatGoogleGenerativeAI
import {
    DDIAlert,
    LLMConversationState,
    PatientContextInput,
    ToolResult, // Keep ToolResult type
} from "../types";

// LangChain imports
import { Tool } from "@langchain/core/tools"; // Generic Tool class
import { AgentExecutor, createToolCallingAgent } from "langchain/agents"; // For creating and executing tool-calling agents
import { ChatPromptTemplate } from "@langchain/core/prompts"; // For structured prompts
import { MessagesPlaceholder } from "@langchain/core/prompts"; // For conversation history placeholder
import { AIMessage, HumanMessage } from "@langchain/core/messages"; // For explicit message types

import { KGQAgent } from "./kgqAgent";
import { ERAAgent } from "./eraAgent";

// Instantiate internal agents (these will be wrapped as LangChain Tools)
const kgqAgentInstance = new KGQAgent();
const eraAgentInstance = new ERAAgent();

// --- LangChain Tool Wrappers for KGQAgent and ERAAgent ---
class KGQueryTool extends Tool {
    name = "kg_query";
    description = "Queries the Knowledge Graph for direct drug-drug interactions, mechanisms, consequences, and patient-specific exacerbations given a list of medication names and patient context. Returns structured DDI data.";
    // Define schema more robustly if needed, matching what LLM expects
    // _parameters and _call are internal LangChain methods
    constructor() { super(); }
    async _call(input: string): Promise<string> {
        try {
            const parsedInput = JSON.parse(input);
            const result = await kgqAgentInstance.getDDIContext(parsedInput.medications, parsedInput.patientContext);
            return JSON.stringify({ status: 'success', data: result } as ToolResult);
        } catch (error: any) {
            return JSON.stringify({ status: 'failure', error: error.message } as ToolResult);
        }
    }
}

class ERARetrieveTool extends Tool {
    name = "era_retrieve";
    description = "Retrieves evidence-based text snippets from the vector database (Pinecone) based on a semantic query related to drug interactions or effects. Returns a list of relevant text snippets.";
    constructor() { super(); }
    async _call(input: string): Promise<string> {
        try {
            const parsedInput = JSON.parse(input);
            const result = await eraAgentInstance.retrieveEvidence(parsedInput.query, parsedInput.topK);
            return JSON.stringify({ status: 'success', data: result } as ToolResult);
        } catch (error: any) {
            return JSON.stringify({ status: 'failure', error: error.message } as ToolResult);
        }
    }
}

export class EGAAgent {
    private agentExecutor: AgentExecutor;

    constructor() {
        console.log("EGAAgent initialized with LangChain");
        const llm = getGenerativeModel(); // Get LangChain-wrapped LLM
        const tools = [
            new KGQueryTool(),
            new ERARetrieveTool(),
            // Add other tools here
        ];

        // Define the prompt template for the agent
        // This is where your Model Context Protocol instructions go.
        const agentPrompt = ChatPromptTemplate.fromMessages([
            new HumanMessage(`You are an expert clinical pharmacologist and an AI-powered drug interaction early warning system.
            Your task is to analyze potential drug-drug interactions (DDIs) and adverse drug reactions (ADRs)
            for a patient, considering their specific context. You can use the following tools to gather information:
            `),
            new MessagesPlaceholder("chat_history"), // Placeholder for conversation history
            new HumanMessage(`Patient medications and context: {patient_input}.
            Based on the above, determine if there are drug interactions.
            Once all necessary information is gathered, output the DDI alert in JSON format,
            adhering strictly to the DDIAlert TypeScript interface:
            interface DDIAlert {
              severity: 'Critical' | 'High' | 'Moderate' | 'Low';
              drugA: string;
              drugB: string;
              explanation: string;
              clinicalImplication: string;
              recommendation: string;
            }`),
            new MessagesPlaceholder("agent_scratchpad"), // Required for agent internal state
        ]);

        // Create the tool-calling agent
        const agent = createToolCallingAgent({
            llm: llm,
            tools: tools,
            prompt: agentPrompt,
        });

        // Create the AgentExecutor
        this.agentExecutor = new AgentExecutor({
            agent: agent,
            tools: tools,
            verbose: true, // Set to true for debugging agent's thought process
        });
    }

    /**
     * Initiates and runs the LangChain Agent to generate a DDI alert.
     * @param initialContext The initial patient and medication context.
     * @returns A DDIAlert object.
     */
    async generateDDIAlert(
        patientContext: PatientContextInput,
        allMedicationNames: string[]
    ): Promise<DDIAlert> {
        const initialUserInput = `Patient has existing medications: ${allMedicationNames.join(', ')}. ` +
                                 `Patient context: Age Group: ${patientContext.age_group || 'Not specified'}, ` +
                                 `Renal Impairment: ${patientContext.renal_status ? 'Yes' : 'No'}, ` +
                                 `Hepatic Impairment: ${patientContext.hepatic_status ? 'Yes' : 'No'}, ` +
                                 `Cardiac Disease: ${patientContext.cardiac_status ? 'Yes' : 'No'}.`;

        try {
            // The agentExecutor will manage the entire multi-turn interaction
            // and tool calls internally.
            const result = await this.agentExecutor.invoke({
                patient_input: initialUserInput, // This maps to the prompt placeholder
                chat_history: [], // Start with empty history for a fresh interaction
            });

            const finalOutput = result.output; // This should be the JSON string from the LLM

            // Parse the final alert. Need robust parsing to handle markdown wrappers etc.
            let jsonString = finalOutput.trim();
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7, jsonString.lastIndexOf('```')).trim();
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.substring(3, jsonString.lastIndexOf('```')).trim();
            }

            const parsedAlert: DDIAlert = JSON.parse(jsonString);

            // Basic validation
            if (!parsedAlert.severity || !parsedAlert.explanation || !parsedAlert.clinicalImplication || !parsedAlert.recommendation) {
                throw new Error("LangChain Agent did not return a complete DDIAlert.");
            }

            // You might need logic here to ensure drugA and drugB are correct from initial context
            // or from a successful KG query that the LLM used.
            // For simplicity, assuming LLM populates them correctly based on its reasoning.
            parsedAlert.drugA = parsedAlert.drugA || allMedicationNames[0] || 'N/A';
            parsedAlert.drugB = parsedAlert.drugB || allMedicationNames[1] || 'N/A'; // Assuming two main drugs

            console.log("Generated Alert (via LangChain Agent):", parsedAlert);
            return parsedAlert;

        } catch (error) {
            console.error('Error running LangChain Agent for DDI alert generation:', error);
            return {
                severity: 'Critical', // Indicate a critical error in alert generation itself
                drugA: 'UNKNOWN',
                drugB: 'UNKNOWN',
                explanation: 'Failed to generate a detailed alert due to an internal AI system error with LangChain Agent.',
                clinicalImplication: 'Automated alert unavailable. Manual clinical review is required immediately.',
                recommendation: 'Verify system logs and AI service status. Do not proceed without manual verification.'
            };
        }
    }
}