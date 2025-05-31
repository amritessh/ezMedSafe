import { PatientContextInput, MedicationInput } from '../types';

interface DDIContext {
  drugA: string;
  drugB: string;
  mechanism: string;
  interactionNotes?: string;
  clinicalConsequences: string[];
  exacerbatedByCharacteristics: string[];
}

export class KGQAgent {
  async getDDIContext(medications: string[], patientContext: PatientContextInput): Promise<DDIContext[]> {
    // TODO: Implement actual KG query logic
    return [];
  }
}
