// ezmedsafe-backend-node/src/services/interactionService.ts
import { EGAAgent } from '../agents/egaAgent';
import prisma from '../clients/prismaClient';
import {
    DDIAlert,
    PatientContextInput,
    MedicationInput,
    LLMConversationState,
    LLMMessage,
} from '../types';
import { getKafkaProducer } from '../clients/kafkaClient';
import crypto from 'crypto';

const egaAgent = new EGAAgent(); // Instantiate the refactored EGAAgent

const INTERACTION_ALERTS_TOPIC = process.env.KAFKA_ALERTS_TOPIC || 'interaction_alerts_generated';

export class InteractionService {
    async checkAndPersistInteractions(
        userId: string,
        patientProfileId: string,
        patientContext: PatientContextInput,
        existingMedications: MedicationInput[],
        newMedication: MedicationInput
    ): Promise<DDIAlert[]> {
        const alertsToReturn: DDIAlert[] = [];

        try {
            // 1. Ensure Medication exists and create Prescription (no change here)
            let newMedicationRecord = await prisma.medication.upsert({
                where: { rx_norm_id: newMedication.rxNormId || '' },
                update: { name: newMedication.name },
                create: { id: crypto.randomUUID(), name: newMedication.name, rx_norm_id: newMedication.rxNormId || null }
            });
            const newPrescription = await prisma.prescription.create({
                data: {
                    patientProfileId: patientProfileId,
                    medicationId: newMedicationRecord.id,
                    type: 'NEW',
                },
            });
            const prescriptionId = newPrescription.id;

            // 2. Prepare initial conversation state for the LLM
            const allMedicationNames = [
                ...existingMedications.map(m => m.name),
                newMedication.name
            ];

            // Initial user prompt to the LLM to start the DDI analysis
            const initialUserPrompt: LLMMessage = {
                role: 'user',
                parts: [{
                    text: `Patient has existing medications: ${existingMedications.map(m => m.name).join(', ')}. ` +
                          `New medication proposed: ${newMedication.name}. Patient context: Age Group: ${patientContext.age_group || 'Not specified'}, ` +
                          `Renal Impairment: ${patientContext.renal_status ? 'Yes' : 'No'}, ` +
                          `Hepatic Impairment: ${patientContext.hepatic_status ? 'Yes' : 'No'}, ` +
                          `Cardiac Disease: ${patientContext.cardiac_status ? 'Yes' : 'No'}. ` +
                          `Please determine if there are any drug interactions and generate a DDI Alert.`
                }]
            };

            let conversationState: LLMConversationState = {
                history: [initialUserPrompt], // Start history with the user's request
                initialContext: { // Preserve initial context for potential LLM use or fallback
                    patientContext: patientContext,
                    allMedicationNames: allMedicationNames
                }
            };

            let finalAlert: DDIAlert | null = null;
            let maxTurns = 10; // Set a limit to prevent infinite loops during LLM interaction

            // Orchestrate the multi-turn LLM interaction
            for (let i = 0; i < maxTurns; i++) {
                const result = await egaAgent.orchestrateDDIAlertGeneration(conversationState);

                if ('severity' in result) {
                    // The LLM has returned a final DDIAlert
                    finalAlert = result;
                    break;
                } else {
                    // The LLM has returned an updated conversation state (e.g., after a tool call)
                    conversationState = result;
                    // Add a safety check: if history isn't growing, break to prevent infinite loops
                    if (i > 0 && conversationState.history.length <= initialUserPrompt.parts.length) {
                        console.warn("Conversation history not growing, potential loop. Breaking.");
                        break;
                    }
                }
            }

            if (finalAlert) {
                alertsToReturn.push(finalAlert);
            } else {
                // Fallback if LLM failed to produce a final alert within max turns
                console.warn("LLM did not produce a final alert within max turns. Generating a fallback alert.");
                const fallbackAlert: DDIAlert = {
                    severity: 'Low',
                    drugA: newMedication.name,
                    drugB: 'N/A', // Cannot definitively determine drugB without LLM output
                    explanation: 'Failed to generate a detailed alert from AI after multiple attempts.',
                    clinicalImplication: 'AI alert generation unsuccessful.',
                    recommendation: 'Please manually review medications and patient context for interactions.',
                };
                alertsToReturn.push(fallbackAlert);
            }

            // 4. Persist the generated alerts and publish to Kafka (as before)
            for (const alert of alertsToReturn) {
                await prisma.interactionAlert.create({
                    data: {
                        userId: userId,
                        patientProfileId: patientProfileId,
                        prescriptionId: prescriptionId,
                        alertData: JSON.parse(JSON.stringify(alert)), // Store as JSON in DB
                    },
                });

                try {
                    const producer = getKafkaProducer();
                    const eventPayload = {
                        type: 'interaction_alert_generated',
                        alertId: crypto.randomUUID(), // Generate a unique ID for the alert
                        userId: userId,
                        patientProfileId: patientProfileId,
                        alertDetails: alert,
                        timestamp: new Date().toISOString()
                    };
                    producer.produce(
                        INTERACTION_ALERTS_TOPIC,
                        null,
                        Buffer.from(JSON.stringify(eventPayload)),
                        eventPayload.alertId, // Use alertId as Kafka key
                        Date.now()
                    );
                    console.log(`Published alert event to Kafka topic: ${INTERACTION_ALERTS_TOPIC}`);
                } catch (kafkaError) {
                    console.error('Failed to publish Kafka event:', kafkaError);
                }
            }

            return alertsToReturn;

        } catch (error) {
            console.error('Error in InteractionService.checkAndPersistInteractions:', error);
            throw error;
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