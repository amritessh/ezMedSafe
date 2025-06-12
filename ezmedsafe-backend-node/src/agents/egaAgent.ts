// ezmedsafe-backend-node/src/agents/egaAgent.ts
import { getGenerativeModel } from "../clients/geminiClient";
import { SchemaType, FunctionDeclaration, Tool } from "@google/generative-ai";
import {
    DDIAlert,
    LLMConversationState,
    LLMMessage,
    LLMToolCall,
    ToolFunction,
    ToolResult,
    DDIQueryResult, // Keep DDIQueryResult for tool output typing
} from "../types";
import { KGQAgent } from "./kgqAgent"; // Import KGQAgent to execute its functions
import { ERAAgent } from "./eraAgent"; // Import ERAAgent to execute its functions

// Instantiate agents for internal use by EGAAgent when LLM calls a tool
const kgqAgent = new KGQAgent();
const eraAgent = new ERAAgent();

export class EGAAgent {
    constructor() {
        console.log("EGAAgent initialized for MCP");
    }

    // Define the tools that the LLM can "call" (these define the LLM's capabilities)
    private getToolDefinitions(): ToolFunction[] {
        return [
            {
                name: "kg_query",
                description: "Queries the Knowledge Graph for direct drug-drug interactions, mechanisms, consequences, and patient-specific exacerbations given a list of medication names and patient context.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        medications: { 
                            type: SchemaType.ARRAY, 
                            description: "List of medication names (strings) to check for interactions.", 
                            items: { type: SchemaType.STRING } 
                        },
                        patientContext: {
                            type: SchemaType.OBJECT,
                            description: "Patient's relevant physiological context (renal, hepatic, cardiac status) and age group.",
                            properties: {
                                age_group: { 
                                    type: SchemaType.STRING, 
                                    description: "Patient's age group category", 
                                    enum: ["Child", "Adult", "Elderly"] 
                                },
                                renal_status: { 
                                    type: SchemaType.BOOLEAN, 
                                    description: "Whether patient has renal impairment" 
                                },
                                hepatic_status: { 
                                    type: SchemaType.BOOLEAN, 
                                    description: "Whether patient has hepatic impairment" 
                                },
                                cardiac_status: { 
                                    type: SchemaType.BOOLEAN, 
                                    description: "Whether patient has cardiac impairment" 
                                }
                            }
                        }
                    },
                    required: ["medications", "patientContext"]
                }
            },
            {
                name: "era_retrieve",
                description: "Retrieves evidence-based text snippets from the Pinecone vector database based on a semantic query related to drug interactions or effects.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        query: { 
                            type: SchemaType.STRING, 
                            description: "The semantic query string to find relevant evidence (e.g., 'interaction between X and Y mechanism')." 
                        },
                        topK: { 
                            type: SchemaType.NUMBER, 
                            description: "Optional. Number of top results to retrieve (default 3).", 
                            default: 3 
                        }
                    },
                    required: ["query"]
                }
            }
        ];
    }

    /**
     * Orchestrates the multi-turn interaction with the LLM to generate a DDI alert.
     * This method manages the LLM's tool calls and integrates tool results.
     * @param state The current conversation state including history and initial context.
     * @returns A DDIAlert object if the LLM successfully generates it, otherwise continues the conversation.
     */
    async orchestrateDDIAlertGeneration(
        state: LLMConversationState
    ): Promise<DDIAlert | LLMConversationState> {
        const model = getGenerativeModel();
        const tools = this.getToolDefinitions();

        // Convert LLMMessage to Gemini Content format
        const convertToGeminiContent = (message: LLMMessage) => {
            return {
                role: message.role,
                parts: message.parts.map(part => {
                    if ('text' in part) return { text: part.text };
                    if ('tool_code' in part) return { 
                        functionCall: {
                            name: part.tool_code.tool_name,
                            args: part.tool_code.parameters
                        }
                    };
                    if ('tool_output' in part) return { text: JSON.stringify(part.tool_output) };
                    return { text: '' };
                })
            };
        };

        const systemInstructionText = `
            You are an expert clinical pharmacologist and an AI-powered drug interaction early warning system.
            Your task is to analyze potential drug-drug interactions (DDIs) and adverse drug reactions (ADRs)
            for a patient, considering their specific context. You can use the following tools to gather information:
            ${JSON.stringify(tools)} // Providing tools directly in the prompt
            Once you have gathered all necessary information, generate a drug interaction alert in JSON format.
            The 'severity' should be 'Critical', 'High', 'Moderate', or 'Low'.
            The 'explanation' should describe the mechanism of interaction clearly.
            The 'clinicalImplication' should explain what this means for the patient clinically.
            The 'recommendation' should provide actionable advice for healthcare professionals.

            Ensure your final response is ONLY a JSON object and adheres to the following TypeScript interface:
            interface DDIAlert {
              severity: 'Critical' | 'High' | 'Moderate' | 'Low';
              drugA: string;
              drugB: string;
              explanation: string;
              clinicalImplication: string;
              recommendation: string;
            }
        `;

        // The conversation history passed to the LLM
        // The first message is typically the system instruction, followed by actual conversation turns.
        const conversationContent = [
            { role: 'user', parts: [{ text: systemInstructionText }] } as LLMMessage,
            ...state.history,
        ];

        try {
            const result = await model.generateContent({
                contents: conversationContent.map(convertToGeminiContent),
                tools: [{
                    functionDeclarations: tools.map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: tool.parameters.properties,
                            required: tool.parameters.required
                        }
                    })) as FunctionDeclaration[]
                }] as Tool[]
            });

            const response = result.response;
            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) {
                throw new Error("No response from model");
            }

            const candidate = candidates[0];
            const content = candidate.content;
            if (!content || !content.parts || content.parts.length === 0) {
                throw new Error("No content in response");
            }

            const part = content.parts[0];
            if (part.functionCall) {
                const llmRequestedToolCall: LLMToolCall = {
                    tool_name: part.functionCall.name,
                    parameters: part.functionCall.args
                };

                // Add LLM's tool_code request to history
                const newHistory: LLMMessage[] = [...state.history, { role: 'model', parts: [{ tool_code: llmRequestedToolCall }] }];

                let toolResult: ToolResult | undefined;

                // Execute the tool based on LLM's request
                if (llmRequestedToolCall.tool_name === "kg_query") {
                    try {
                        const kgData = await kgqAgent.getDDIContext(
                            llmRequestedToolCall.parameters.medications,
                            llmRequestedToolCall.parameters.patientContext
                        );
                        toolResult = { tool_name: "kg_query", status: "success", data: kgData };
                    } catch (err: any) {
                        toolResult = { tool_name: "kg_query", status: "failure", error: err.message };
                    }
                } else if (llmRequestedToolCall.tool_name === "era_retrieve") {
                    try {
                        const retrievedEvidence = await eraAgent.retrieveEvidence(
                            llmRequestedToolCall.parameters.query,
                            llmRequestedToolCall.parameters.topK
                        );
                        toolResult = { tool_name: "era_retrieve", status: "success", data: retrievedEvidence };
                    } catch (err: any) {
                        toolResult = { tool_name: "era_retrieve", status: "failure", error: err.message };
                    }
                } else {
                    toolResult = { tool_name: llmRequestedToolCall.tool_name, status: "failure", error: `Unknown tool: ${llmRequestedToolCall.tool_name}` };
                }

                // Add the result of the tool execution back to the history for the LLM
                if (toolResult) {
                    newHistory.push({ role: 'user', parts: [{ tool_output: toolResult }] });
                }

                // Return the updated state, indicating more turns are needed
                return { ...state, history: newHistory };
            } else if (part.text) {
                // If no tool calls, assume LLM has generated the final text response (DDIAlert JSON)
                let jsonString = part.text.trim();
                // Clean up markdown wrapper if present
                if (jsonString.startsWith('```json')) {
                    jsonString = jsonString.substring(7, jsonString.lastIndexOf('```')).trim();
                } else if (jsonString.startsWith('```')) {
                    jsonString = jsonString.substring(3, jsonString.lastIndexOf('```')).trim();
                }

                const parsedAlert: DDIAlert = JSON.parse(jsonString);

                // Basic validation for the final alert structure
                if (!parsedAlert.severity || !parsedAlert.explanation || !parsedAlert.clinicalImplication || !parsedAlert.recommendation) {
                    throw new Error("Gemini final response missing required alert fields.");
                }

                // Ensure drugA and drugB are populated
                const kgResultFromHistory = state.history.find(msg => 
                    msg.parts.some(p => 'tool_output' in p && p.tool_output?.tool_name === 'kg_query' && p.tool_output?.status === 'success')
                )?.parts.find(p => 'tool_output' in p)?.tool_output?.data as DDIQueryResult[] | undefined;

                if (kgResultFromHistory && kgResultFromHistory.length > 0) {
                    parsedAlert.drugA = parsedAlert.drugA || kgResultFromHistory[0].drugA;
                    parsedAlert.drugB = parsedAlert.drugB || kgResultFromHistory[0].drugB;
                } else {
                    parsedAlert.drugA = parsedAlert.drugA || state.initialContext.allMedicationNames[0] || 'N/A';
                    parsedAlert.drugB = parsedAlert.drugB || state.initialContext.allMedicationNames[1] || 'N/A';
                }

                console.log("Generated Alert:", parsedAlert);
                return parsedAlert;
            }

            throw new Error("Unexpected response format from model");
        } catch (error) {
            console.error('Error during LLM orchestration:', error);
            return {
                severity: 'Low',
                drugA: 'Error',
                drugB: 'Error',
                explanation: 'An internal error occurred during alert generation.',
                clinicalImplication: 'Please manually review the medication combination.',
                recommendation: 'Contact support if this persists.',
            };
        }
    }
}