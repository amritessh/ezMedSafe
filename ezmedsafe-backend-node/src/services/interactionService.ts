// src/services/interactionService.ts
import { KGQAgent } from '../agents/kgqAgent';
import { ERAAgent } from '../agents/eraAgent';
import { EGAAgent } from '../agents/egaAgent'; // Import the new EGAAgent
import prisma from '../clients/prismaClient';
import { PatientContextInput, MedicationInput, DDIAlert, DDIQueryResult } from '../types';

const kgqAgent = new KGQAgent();
const eraAgent = new ERAAgent();
const egaAgent = new EGAAgent(); // Initialize EGAAgent

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
                // Query ERA Agent for relevant evidence
                const queryForERA = `Drug interaction between ${kgResult.drugA} and ${kgResult.drugB} mechanism: ${kgResult.mechanism}. Clinical consequences: ${kgResult.clinicalConsequences.join(', ')}.`;
                const retrievedEvidence = await eraAgent.retrieveEvidence(queryForERA);
                console.log(`ERA Agent retrieved evidence for "${queryForERA}":`, retrievedEvidence);

                // Call EGA Agent to generate full explanation
                const generatedAlert = await egaAgent.generateExplanation(
                    kgResult,
                    retrievedEvidence,
                    patientContext
                );
                console.log("EGA Agent generated alert:", generatedAlert);


                alertsToReturn.push(generatedAlert); // Add the full generated alert for frontend response

                // Persist the generated alert
                await prisma.interactionAlert.create({
                    data: {
                        userId: userId,
                        patientProfileId: patientProfileId,
                        prescriptionId: mainPrescriptionId || '00000000-0000-0000-0000-000000000000', // Ensure a valid UUID or handle fallback
                        alertData: generatedAlert as any, // Store the full DDIAlert object as JSONB
                        createdAt: new Date()
                    }
                });
            }
        } else {
            // If no specific DDI found from KG, still create a 'no interaction' alert
            const noAlertData: DDIAlert = {
                severity: 'Low',
                drugA: newMedication.name,
                drugB: 'N/A',
                explanation: 'No direct interaction found in the knowledge base for this specific query. Always consult a healthcare professional.',
                clinicalImplication: 'No high-risk DDI identified within MVP scope. Continue standard clinical monitoring.',
                recommendation: 'Monitor patient for any unexpected symptoms or side effects.',
            };
            alertsToReturn.push(noAlertData);

            await prisma.interactionAlert.create({
                data: {
                    userId: userId,
                    patientProfileId: patientProfileId,
                    prescriptionId: mainPrescriptionId || '00000000-0000-0000-0000-000000000000',
                    alertData: noAlertData as any,
                    createdAt: new Date()
                }
            });
        }
        return alertsToReturn;
    }
}