import { getGenerativeModel } from "../clients/geminiClient";
import { DDIQueryResult, PatientContextInput, DDIAlert } from "../types";

export class EGAAgent {
  constructor() {
    console.log("EGAAgent initialized");
  }

  /**
   * Generates a natural language explanation, clinical implication, and recommendation
   * for a drug interaction using Google Gemini, based on KG data and RAG evidence.
   * @param kgData The raw DDI query result from Neo4j.
   * @param retrievedEvidence Relevant text snippets from Pinecone (RAG).
   * @param patientContext The patient's specific demographic and physiological context.
   * @returns A DDIAlert object with detailed explanation.
   */
  async generateExplanation(
    kgData: DDIQueryResult,
    retrievedEvidence: string[],
    patientContext: PatientContextInput
  ): Promise<DDIAlert> {
    try {
      const model = getGenerativeModel();

      // --- Model Context Protocol: Construct the prompt ---
      const prompt = `
        You are an expert clinical pharmacologist and an AI-powered drug interaction early warning system.
        Your task is to analyze potential drug-drug interactions (DDIs) and adverse drug reactions (ADRs)
        for a patient, considering their specific context. Provide a concise, clear, and actionable alert.

        Here is the core drug-drug interaction information from the knowledge graph:
        Drug A: ${kgData.drugA}
        Drug B: ${kgData.drugB}
        Mechanism of Interaction: ${kgData.mechanism}
        Interaction Notes: ${kgData.interactionNotes || 'None provided.'}
        Clinical Consequences: ${kgData.clinicalConsequences.join(', ') || 'None specified.'}
        Exacerbated by Patient Characteristics: ${kgData.exacerbatedByCharacteristics.join(', ') || 'None specified.'}

        Here is additional evidence-based information from drug labels, pharmacology texts, or clinical guidelines:
        ${retrievedEvidence.length > 0 ? retrievedEvidence.map(e => `- ${e}`).join('\n') : 'No additional evidence retrieved.'}

        Patient Context:
        Age Group: ${patientContext.age_group || 'Not specified'}
        Renal Impairment: ${patientContext.renal_status ? 'Yes' : 'No'}
        Hepatic Impairment: ${patientContext.hepatic_status ? 'Yes' : 'No'}
        Cardiac Disease: ${patientContext.cardiac_status ? 'Yes' : 'No'}

        Based on the above information, generate a drug interaction alert in JSON format.
        The 'severity' should be 'Critical', 'High', 'Moderate', or 'Low'.
        The 'explanation' should describe the mechanism of interaction clearly.
        The 'clinicalImplication' should explain what this means for the patient clinically.
        The 'recommendation' should provide actionable advice for healthcare professionals.

        Ensure your response is ONLY a JSON object and adheres to the following TypeScript interface:
        interface DDIAlert {
          severity: 'Critical' | 'High' | 'Moderate' | 'Low';
          drugA: string;
          drugB: string;
          explanation: string;
          clinicalImplication: string;
          recommendation: string;
        }
      `;

      // --- LLM Call ---
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // --- Output Parsing ---
      // Attempt to parse the JSON. Gemini might wrap it in markdown.
      let jsonString = responseText.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.lastIndexOf('```')).trim();
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.lastIndexOf('```')).trim();
      }

      const parsedAlert: DDIAlert = JSON.parse(jsonString);

      // Basic validation for parsed output (optional, but good practice)
      if (!parsedAlert.severity || !parsedAlert.explanation || !parsedAlert.clinicalImplication || !parsedAlert.recommendation) {
          throw new Error("Gemini response missing required alert fields.");
      }

      // The drugA and drugB should come from the KG data, not necessarily the LLM output directly.
      // We'll set these explicitly to ensure consistency with the interaction being reported.
      parsedAlert.drugA = kgData.drugA;
      parsedAlert.drugB = kgData.drugB;

      console.log("Generated Alert:", parsedAlert);
      return parsedAlert;

    } catch (error) {
      console.error('Error in EGAAgent.generateExplanation:', error);
      // Provide a fallback alert or re-throw
      return {
        severity: 'Low',
        drugA: kgData.drugA,
        drugB: kgData.drugB,
        explanation: 'Failed to generate detailed explanation. Please check AI service.',
        clinicalImplication: 'AI explanation unavailable.',
        recommendation: 'Consult clinical resources manually.',
      };
    }
  }
}