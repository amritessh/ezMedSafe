import driver from "../clients/neo4jClient";
import {PatientContextInput, MedicationInput, DDIQueryResult} from "../types";


export class KGQAgent {
  constructor(){
    console.log("KGQAgent initialized");
  }

async getDDIContext(medications: string[],
  patientContext: PatientContextInput): Promise<DDIQueryResult[]> {
    const session = driver.session();
    const results: DDIQueryResult[] = [];
  
    try{
      const medicationNamesLower = medications.map(name => name.toLowerCase());
      const queryDirectDDIs = `
       UNWIND $medNames AS drugName1
       UNWIND $medNames AS drugName2
       MATCH (d1:Drug) WHERE toLower(d1.name) = drugName1
       MATCH (d2:Drug) WHERE toLower(d2.name) = drugName2
       MATCH (d1)-[r:INTERACTS_WITH]->(d2)
       OPTIONAL MATCH (r)-[:INCREASES_RISK_OF]->(c:ClinicalConsequence)
       OPTIONAL MATCH (r)-[:EXACERBATED_BY]->(pc:PatientCharacteristic)
       RETURN d1.name AS drugA, d2.name AS drugB, r.mechanism AS mechanism,r.notes AS interactionNotes,
       COLLECT(DISTINCT c.name) AS clinicalConsequences, COLLECT(DISTINCT pc.name) AS exacerbatedByCharacteristics
       WHERE d1.name <> d2.name
       `;

       const directDDIsResult = await session.run(queryDirectDDIs, { medNames: medicationNamesLower });

       for (const record of directDDIsResult.records) {
         const drugA = record.get('drugA');
         const drugB = record.get('drugB');
         const mechanism = record.get('mechanism');
         const interactionNotes = record.get('interactionNotes');
         const clinicalConsequences = record.get('clinicalConsequences');
         const kgExacerbatedByCharacteristics = record.get('exacerbatedByCharacteristics'); // Characteristics from KG

         // Filter KG characteristics to only include those present in the *patient's actual context*
         let relevantPatientExacerbations: string[] = [];
         if (patientContext.renal_status && kgExacerbatedByCharacteristics.includes('Renal Impairment')) {
             relevantPatientExacerbations.push('Renal Impairment');
         }
         if (patientContext.hepatic_status && kgExacerbatedByCharacteristics.includes('Hepatic Impairment')) {
             relevantPatientExacerbations.push('Hepatic Impairment');
         }
         if (patientContext.cardiac_status && kgExacerbatedByCharacteristics.includes('Cardiac Disease')) {
             relevantPatientExacerbations.push('Cardiac Disease');
         }
         // Add more patient context checks here if you added more PatientCharacteristic nodes
         // Example: if (patientContext.age_group === 'Elderly' && kgExacerbatedByCharacteristics.includes('Elderly')) { ... }

         results.push({
           drugA,
           drugB,
           mechanism,
           interactionNotes,
           clinicalConsequences,
           exacerbatedByCharacteristics: relevantPatientExacerbations,
         });
       }

     } catch (error) {
       console.error('Error in KGQAgent.getDDIContext:', error);
       // Depending on error type, you might want to return empty or specific error
       throw error; // Re-throw to be handled by the caller
     } finally {
       await session.close();
     }
     return results;
   }
      
      
  
}