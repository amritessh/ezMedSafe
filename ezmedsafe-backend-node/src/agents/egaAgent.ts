// ezmedsafe-backend-node/src/agents/egaAgent.ts
import { getGenerativeModel } from "../clients/geminiClient";
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
                    type: "object" as const,
                    properties: {
                        medications: { type: "array" as const, description: "List of medication names (strings) to check for interactions.", items: { type: "string" as const } },
                        patientContext: {
                            type: "object" as const,
                            description: "Patient's relevant physiological context (renal, hepatic, cardiac status) and age group.",
                            properties: {
                                age_group: { type: "string" as const, description: "Patient's age group category", enum: ["Child", "Adult", "Elderly"] },
                                renal_status: { type: "boolean" as const, description: "Whether patient has renal impairment" },
                                hepatic_status: { type: "boolean" as const, description: "Whether patient has hepatic impairment" },
                                cardiac_status: { type: "boolean" as const, description: "Whether patient has cardiac impairment" }
                            }
                        }
                    },
                    required: ["medications", "patientContext"]
                },
            },
            {
                name: "era_retrieve",
                description: "Retrieves evidence-based text snippets from the Pinecone vector database based on a semantic query related to drug interactions or effects.",
                parameters: {
                    type: "object" as const,
                    properties: {
                        query: { type: "string" as const, description: "The semantic query string to find relevant evidence (e.g., 'interaction between X and Y mechanism')." },
                        topK: { type: "number" as const, description: "Optional. Number of top results to retrieve (default 3).", default: 3 }
                    },
                    required: ["query"]
                },
            },
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
                tools: tools.map(tool => ({
                    functionDeclarations: [{
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters
                    }]
                }))
            });

            const responseParts = result.response.parts;

            // Check if the LLM's response contains tool calls
            if (responseParts && responseParts.length > 0 && responseParts[0].tool_calls) {
                const toolCalls = responseParts[0].tool_calls;
                if (!toolCalls || toolCalls.length === 0) {
                    throw new Error("LLM returned empty tool calls array.");
                }

                // Assuming LLM makes one tool call at a time for simplicity in this example
                const llmRequestedToolCall: LLMToolCall = {
                    tool_name: toolCalls[0].functionCall.name,
                    parameters: toolCalls[0].functionCall.args,
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

            } else {
                // If no tool calls, assume LLM has generated the final text response (DDIAlert JSON)
                const responseText = result.response.text();
                let jsonString = responseText.trim();
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

                // Ensure drugA and drugB are populated, possibly from the initial context or a successful KG query result
                // A more robust solution might extract these directly from the relevant tool_output in history.
                const kgResultFromHistory = state.history.find(msg => msg.parts.some(p => p.tool_output?.tool_name === 'kg_query' && p.tool_output?.status === 'success'))?.parts
                                          .find(p => p.tool_output)?.tool_output?.data as DDIQueryResult[] | undefined;

                if (kgResultFromHistory && kgResultFromHistory.length > 0) {
                    // Assuming the alert refers to the first DDI found, or iterate if multiple alerts expected
                    parsedAlert.drugA = parsedAlert.drugA || kgResultFromHistory[0].drugA;
                    parsedAlert.drugB = parsedAlert.drugB || kgResultFromHistory[0].drugB;
                } else {
                    // Fallback to initial context if no KG result, or if LLM didn't include them
                    parsedAlert.drugA = parsedAlert.drugA || state.initialContext.allMedicationNames[0] || 'N/A';
                    parsedAlert.drugB = parsedAlert.drugB || state.initialContext.allMedicationNames[1] || 'N/A';
                }

                console.log("Generated Alert:", parsedAlert);
                return parsedAlert; // Return the final DDIAlert
            }

        } catch (error) {
            console.error('Error during LLM orchestration:', error);
            // Fallback for critical errors during LLM interaction
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