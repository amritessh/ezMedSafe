// src/services/interactionService.ts
import { KGQAgent } from '../agents/kgqAgent';
import { ERAAgent } from '../agents/eraAgent';
import { EGAAgent } from '../agents/egaAgent'; // Import the new EGAAgent
import prisma from '../clients/prismaClient';
import { PatientContextInput, MedicationInput, DDIAlert, DDIQueryResult } from '../types';
import { getKafkaProducer } from '../clients/kafkaClient';
import crypto from 'crypto';

const kgqAgent = new KGQAgent();
const eraAgent = new ERAAgent();
const egaAgent = new EGAAgent(); // Initialize EGAAgent

const INTERACTION_ALERTS_TOPIC = process.env.KAFKA_ALERTS_TOPIC || 'interaction_alerts_generated';

export class InteractionService {
  async checkAndPersistInteractions(
    userId: string,
    patientProfileId: string,
    patientContext: PatientContextInput,
    existingMedications: MedicationInput[],
    newMedication: MedicationInput
  ): Promise<DDIAlert[]> {
    const alertsToReturn: DDIAlert[] = []; // Collect alerts to return

    try {
      // 1. Ensure Medication exists in DB (or create it)
      //    The `newMedication` input might just have `name`.
      //    You need to find its database `id` or create it if it's new.
      let newMedicationRecord;
      // Example: Find by name, or create if not found
      newMedicationRecord = await prisma.medication.upsert({
          where: { rx_norm_id: newMedication.rxNormId || '' }, // Use rx_norm_id as unique identifier
          update: {
              name: newMedication.name,
          },
          create: {
              id: crypto.randomUUID(), // Generate a new UUID
              name: newMedication.name,
              rx_norm_id: newMedication.rxNormId || null,
          }
      });

      // 2. Create the Prescription record for the new medication
      const newPrescription = await prisma.prescription.create({
        data: {
          patientProfileId: patientProfileId,
          medicationId: newMedicationRecord.id,
          type: 'NEW',
        },
      });

      // Now, newPrescription.id contains the valid UUID needed for InteractionAlert
      const prescriptionId = newPrescription.id;

      // 3. Perform DDI check (this is where KGQAgent comes in)
      const allMedicationNames = [
          ...existingMedications.map(m => m.name),
          newMedication.name
      ];

      // Assuming KGQAgent.getDDIContext returns relevant interaction data
      const ddiResults = await kgqAgent.getDDIContext(allMedicationNames, patientContext);

      if (ddiResults.length > 0) {
        // Process DDI results into alerts
        for (const ddi of ddiResults) {
          const alert: DDIAlert = {
            severity: 'Moderate',
            drugA: ddi.drugA,
            drugB: ddi.drugB,
            explanation: `Interaction between ${ddi.drugA} and ${ddi.drugB}: ${ddi.mechanism}`,
            clinicalImplication: `Clinical consequences: ${ddi.clinicalConsequences.join(', ')}`,
            recommendation: 'Please consult with a healthcare provider before proceeding with this medication combination.'
          };
          alertsToReturn.push(alert);

          // Persist the alert to the database
          const createdAlert = await prisma.interactionAlert.create({
            data: {
              userId: userId,
              patientProfileId: patientProfileId,
              prescriptionId: prescriptionId,
              alertData: JSON.parse(JSON.stringify(alert)), // Convert to plain object for JSON storage
            },
          });
          // You might log createdAlert.id or something here
        }
      } else {
        // No DDI alerts found
        const noAlertData: DDIAlert = {
          severity: 'Low',
          drugA: newMedication.name,
          drugB: 'N/A',
          explanation: 'No significant drug-drug interactions found for the new medication.',
          clinicalImplication: 'The medication appears safe to use with current medications.',
          recommendation: 'Continue monitoring for any adverse effects.'
        };
        alertsToReturn.push(noAlertData);
        // Still persist a "no alert" entry for auditing if desired
        await prisma.interactionAlert.create({
          data: {
            userId: userId,
            patientProfileId: patientProfileId,
            prescriptionId: prescriptionId,
            alertData: JSON.parse(JSON.stringify(noAlertData)),
          },
        });
      }

      // ... (handle other types of alerts, like ERA, EGA if applicable) ...

      return alertsToReturn;

    } catch (error) {
      console.error('Error checking interactions and persisting:', error);
      throw error; // Re-throw for handling by the route
    }
  }
}


// export class InteractionService {

//     async checkAndPersistInteractions(
//         userId: string,
//         patientProfileId: string,
//         patientContext: PatientContextInput,
//         existingMedications: MedicationInput[],
//         newMedication: MedicationInput
//     ): Promise<DDIAlert[]> {
//         const medicationRecords = await prisma.medication.findMany({
//             where: {
//                 name: {
//                     in: [...existingMedications.map(m => m.name), newMedication.name]
//                 }
//             }
//         });

//         const getMedId = (name: string) => medicationRecords.find(m => m.name === name)?.id;

//         const prescriptionsToCreate: { patientProfileId: string, medicationId: string, type: 'EXISTING' | 'NEW' }[] = [];
//         for (const med of existingMedications) {
//             const medId = getMedId(med.name);
//             if (medId) {
//                 prescriptionsToCreate.push({ patientProfileId: patientProfileId, medicationId: medId, type: 'EXISTING' });
//             }
//         }
//         const newMedId = getMedId(newMedication.name);
//         if (newMedId) {
//             prescriptionsToCreate.push({ patientProfileId: patientProfileId, medicationId: newMedId, type: 'NEW' });
//         }

//         await prisma.prescription.createMany({
//             data: prescriptionsToCreate
//         });

//         const newMedPrescription = await prisma.prescription.findFirst({
//             where: {
//                 patientProfileId: patientProfileId,
//                 medicationId: newMedId,
//                 type: 'NEW'
//             },
//             orderBy: { createdAt: 'desc' }
//         });
//         const mainPrescriptionId = newMedPrescription?.id;

//         const allMedNames = [...existingMedications.map(m => m.name), newMedication.name];
//         const ddiResultsFromKG: DDIQueryResult[] = await kgqAgent.getDDIContext(allMedNames, patientContext);

//         const alertsToReturn: DDIAlert[] = [];

//         if (ddiResultsFromKG.length > 0) {
//             for (const kgResult of ddiResultsFromKG) {
//                 const queryForERA = `Drug interaction between ${kgResult.drugA} and ${kgResult.drugB} mechanism: ${kgResult.mechanism}. Clinical consequences: ${kgResult.clinicalConsequences.join(', ')}.`;
//                 const retrievedEvidence = await eraAgent.retrieveEvidence(queryForERA);

//                 const generatedAlert = await egaAgent.generateExplanation(
//                     kgResult,
//                     retrievedEvidence,
//                     patientContext
//                 );

//                 alertsToReturn.push(generatedAlert);

//                 // Persist the generated alert
//                 const createdAlert = await prisma.interactionAlert.create({
//                     data: {
//                         userId: userId,
//                         patientProfileId: patientProfileId,
//                         prescriptionId: mainPrescriptionId || '00000000-0000-0000-0000-000000000000',
//                         alertData: generatedAlert as any,
//                         createdAt: new Date()
//                     }
//                 });

//                 // --- Publish Event to Kafka ---
//                 try {
//                     const producer = getKafkaProducer();
//                     const eventPayload = {
//                         type: 'interaction_alert_generated',
//                         alertId: createdAlert.id,
//                         userId: userId,
//                         patientProfileId: patientProfileId,
//                         alertDetails: generatedAlert,
//                         timestamp: new Date().toISOString()
//                     };
//                     producer.produce(
//                         INTERACTION_ALERTS_TOPIC,
//                         null, // Partition (null for default)
//                         Buffer.from(JSON.stringify(eventPayload)), // Message payload
//                         createdAlert.id, // Key
//                         Date.now() // Timestamp
//                     );
//                     console.log(`Published alert event to Kafka topic: ${INTERACTION_ALERTS_TOPIC}`);
//                 } catch (kafkaError) {
//                     console.error('Failed to publish Kafka event:', kafkaError);
//                 }
//             }
//         } else {
//             const noAlertData: DDIAlert = {
//                 severity: 'Low',
//                 drugA: newMedication.name,
//                 drugB: 'N/A',
//                 explanation: 'No direct interaction found in the knowledge base for this specific query. Always consult a healthcare professional.',
//                 clinicalImplication: 'No high-risk DDI identified within MVP scope. Continue standard clinical monitoring.',
//                 recommendation: 'Monitor patient for any unexpected symptoms or side effects.',
//             };
//             alertsToReturn.push(noAlertData);

//             const createdAlert = await prisma.interactionAlert.create({
//                 data: {
//                     userId: userId,
//                     patientProfileId: patientProfileId,
//                     prescriptionId: mainPrescriptionId || '00000000-0000-0000-0000-000000000000',
//                     alertData: noAlertData as any,
//                     createdAt: new Date()
//                 }
//             });

//             // --- Publish Event to Kafka (even for no interaction) ---
//             try {
//                 const producer = getKafkaProducer();
//                 const eventPayload = {
//                     type: 'interaction_alert_generated',
//                     alertId: createdAlert.id,
//                     userId: userId,
//                     patientProfileId: patientProfileId,
//                     alertDetails: noAlertData,
//                     timestamp: new Date().toISOString()
//                 };
//                 producer.produce(
//                     INTERACTION_ALERTS_TOPIC,
//                     null,
//                     Buffer.from(JSON.stringify(eventPayload)),
//                     createdAlert.id,
//                     Date.now()
//                 );
//                 console.log(`Published 'no interaction' event to Kafka topic: ${INTERACTION_ALERTS_TOPIC}`);
//             } catch (kafkaError) {
//                 console.error('Failed to publish Kafka event (no interaction):', kafkaError);
//             }
//         }
//         return alertsToReturn;
//     }
// }