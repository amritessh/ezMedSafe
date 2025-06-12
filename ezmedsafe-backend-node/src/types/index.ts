export interface PatientContextInput {

  age_group?: 'Pediatric' | 'Adult' | 'Elderly';
  renal_status?: boolean;
  hepatic_status?: boolean;
  cardiac_status?: boolean;
}

export interface MedicationInput {
  name: string;
  rxNormId?: string;
}

export interface DDIQueryResult {
  drugA: string;
  drugB: string;
  mechanism: string;
  interactionNotes?: string;
  clinicalConsequences: string[];
  exacerbatedByCharacteristics: string[];
}


export interface DDIAlert {
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  drugA: string;
  drugB: string;
  explanation: string;
  clinicalImplication: string;
  recommendation: string;
} 


export interface UserAuth {
  id: string;
  apiKey: string;
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
      type: "object";
      properties: { 
          [key: string]: { 
              type: string; 
              description: string; 
              items?: { type: string };
              properties?: { [key: string]: { type: string; description: string; enum?: string[] } };
              enum?: string[];
              default?: any;
          } 
      };
      required?: string[];
  };
}


export interface LLMToolCall {
  tool_name: string; // The name of the tool function to call (e.g., "kg_query")
  parameters: { [key: string]: any }; // Parameters to pass to that tool function
}

// Represents the standardized result returned by a tool after execution.
export interface ToolResult<T = any> {
  tool_name: string; // The name of the tool that was called (e.g., "kg_query")
  status: 'success' | 'failure'; // Status of the tool execution
  data?: T; // The actual data payload returned by the tool
  error?: string; // Error message if status is 'failure'
  // You could add request_id, timestamp, etc., for more robust logging/tracing
}

// Represents a single message in the LLM's conversation history, including tool interactions.
export type LLMMessage = {
  role: 'user' | 'model'; // 'user' for what we feed to the LLM, 'model' for LLM's output
  parts: Array<
      { text: string } | // Standard text message
      { tool_code: LLMToolCall } | // LLM's request to call a tool
      { tool_output: ToolResult } // Result of a tool call being fed back to the LLM
  >;
};

// Represents the overall state of the multi-turn LLM conversation.
export interface LLMConversationState {
  history: LLMMessage[]; // The full conversation history
  // tools: ToolFunction[]; // Tools could be defined here or passed directly to model.generateContent
  initialContext: { // Initial input context for the whole interaction
      patientContext: PatientContextInput;
      allMedicationNames: string[];
  };
}