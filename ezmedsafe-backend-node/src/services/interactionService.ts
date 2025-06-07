// src/services/interactionService.ts
import { KGQAgent } from '../agents/kgqAgent';
import { ERAAgent } from '../agents/eraAgent';
import { EGAAgent } from '../agents/egaAgent'; // Import the new EGAAgent
import prisma from '../clients/prismaClient';
import { PatientContextInput, MedicationInput, DDIAlert, DDIQueryResult } from '../types';
import { getKafkaProducer } from '../clients/kafkaClient';

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
        const medicationRecords = await prisma.medication.findMany({
            where: {
                name: {
                    in: [...existingMedications.map(m => m.name), newMedication.name]
                }
            }
        });

        const getMedId = (name: string) => medicationRecords.find(m => m.name === name)?.id;

        const prescriptionsToCreate: { patientProfileId: string, medicationId: string, type: 'EXISTING' | 'NEW' }[] = [];
        for (const med of existingMedications) {
            const medId = getMedId(med.name);
            if (medId) {
                prescriptionsToCreate.push({ patientProfileId: patientProfileId, medicationId: medId, type: 'EXISTING' });
            }
        }
        const newMedId = getMedId(newMedication.name);
        if (newMedId) {
            prescriptionsToCreate.push({ patientProfileId: patientProfileId, medicationId: newMedId, type: 'NEW' });
        }

        await prisma.prescription.createMany({
            data: prescriptionsToCreate
        });

        const newMedPrescription = await prisma.prescription.findFirst({
            where: {
                patientProfileId: patientProfileId,
                medicationId: newMedId,
                type: 'NEW'
            },
            orderBy: { createdAt: 'desc' }
        });
        const mainPrescriptionId = newMedPrescription?.id;

        const allMedNames = [...existingMedications.map(m => m.name), newMedication.name];
        const ddiResultsFromKG: DDIQueryResult[] = await kgqAgent.getDDIContext(allMedNames, patientContext);

        const alertsToReturn: DDIAlert[] = [];

        if (ddiResultsFromKG.length > 0) {
            for (const kgResult of ddiResultsFromKG) {
                const queryForERA = `Drug interaction between ${kgResult.drugA} and ${kgResult.drugB} mechanism: ${kgResult.mechanism}. Clinical consequences: ${kgResult.clinicalConsequences.join(', ')}.`;
                const retrievedEvidence = await eraAgent.retrieveEvidence(queryForERA);

                const generatedAlert = await egaAgent.generateExplanation(
                    kgResult,
                    retrievedEvidence,
                    patientContext
                );

                alertsToReturn.push(generatedAlert);

                // Persist the generated alert
                const createdAlert = await prisma.interactionAlert.create({
                    data: {
                        userId: userId,
                        patientProfileId: patientProfileId,
                        prescriptionId: mainPrescriptionId || '00000000-0000-0000-0000-000000000000',
                        alertData: generatedAlert as any,
                        createdAt: new Date()
                    }
                });

                // --- Publish Event to Kafka ---
                try {
                    const producer = getKafkaProducer();
                    const eventPayload = {
                        type: 'interaction_alert_generated',
                        alertId: createdAlert.id,
                        userId: userId,
                        patientProfileId: patientProfileId,
                        alertDetails: generatedAlert,
                        timestamp: new Date().toISOString()
                    };
                    producer.produce(
                        INTERACTION_ALERTS_TOPIC,
                        null, // Partition (null for default)
                        Buffer.from(JSON.stringify(eventPayload)), // Message payload
                        createdAlert.id, // Key
                        Date.now() // Timestamp
                    );
                    console.log(`Published alert event to Kafka topic: ${INTERACTION_ALERTS_TOPIC}`);
                } catch (kafkaError) {
                    console.error('Failed to publish Kafka event:', kafkaError);
                }
            }
        } else {
            const noAlertData: DDIAlert = {
                severity: 'Low',
                drugA: newMedication.name,
                drugB: 'N/A',
                explanation: 'No direct interaction found in the knowledge base for this specific query. Always consult a healthcare professional.',
                clinicalImplication: 'No high-risk DDI identified within MVP scope. Continue standard clinical monitoring.',
                recommendation: 'Monitor patient for any unexpected symptoms or side effects.',
            };
            alertsToReturn.push(noAlertData);

            const createdAlert = await prisma.interactionAlert.create({
                data: {
                    userId: userId,
                    patientProfileId: patientProfileId,
                    prescriptionId: mainPrescriptionId || '00000000-0000-0000-0000-000000000000',
                    alertData: noAlertData as any,
                    createdAt: new Date()
                }
            });

            // --- Publish Event to Kafka (even for no interaction) ---
            try {
                const producer = getKafkaProducer();
                const eventPayload = {
                    type: 'interaction_alert_generated',
                    alertId: createdAlert.id,
                    userId: userId,
                    patientProfileId: patientProfileId,
                    alertDetails: noAlertData,
                    timestamp: new Date().toISOString()
                };
                producer.produce(
                    INTERACTION_ALERTS_TOPIC,
                    null,
                    Buffer.from(JSON.stringify(eventPayload)),
                    createdAlert.id,
                    Date.now()
                );
                console.log(`Published 'no interaction' event to Kafka topic: ${INTERACTION_ALERTS_TOPIC}`);
            } catch (kafkaError) {
                console.error('Failed to publish Kafka event (no interaction):', kafkaError);
            }
        }
        return alertsToReturn;
    }
}