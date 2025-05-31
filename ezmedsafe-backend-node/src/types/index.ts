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