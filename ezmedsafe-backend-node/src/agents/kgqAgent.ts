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

        OPTIONAL MATCH (d1)-[:INCREASES_RISK_OF]->(c1:ClinicalConsequence)
        OPTIONAL MATCH (d2)-[:INCREASES_RISK_OF]->(c2:ClinicalConsequence)
        OPTIONAL MATCH (d1)-[:EXACERBATED_BY]->(pc1:PatientCharacteristic)
        OPTIONAL MATCH (d2)-[:EXACERBATED_BY]->(pc2:PatientCharacteristic)

       WHERE d1.name <> d2.name
        RETURN d1.name AS drugA, d2.name AS drugB, r.mechanism AS mechanism,r.notes AS interactionNotes,
        // Corrected: Filter out nulls before accessing .name, or collect directly.
        // A common pattern is to collect all, then filter nulls.
        // Or, more directly, collect the names only if the node exists.

        // Simpler way to collect distinct names from potentially null nodes after OPTIONAL MATCH:
        COLLECT(DISTINCT c1.name) + COLLECT(DISTINCT c2.name) AS combinedClinicalConsequences,
        COLLECT(DISTINCT pc1.name) + COLLECT(DISTINCT pc2.name) AS combinedExacerbatedByCharacteristics
       
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