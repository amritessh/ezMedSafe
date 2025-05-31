export interface PatientContextInput {
  age?: number;
  weight?: number;
  gender?: string;
  conditions?: string[];
  allergies?: string[];
}

export interface MedicationInput {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: Date;
}

export interface DDIAlert {
  severity: 'Low' | 'Medium' | 'High';
  drugA: string;
  drugB: string;
  explanation: string;
  clinicalImplication: string;
  recommendation: string;
} 