import { KGQAgent } from '../agents/kgqAgent';
import { ERAAgent } from '../agents/eraAgent';
import prisma from '../clients/prismaClient';
import { PatientContextInput, MedicationInput, DDIAlert, DDIQueryResult } from '../types';

        const kgqAgent = new KGQAgent();
        const eraAgent = new ERAAgent();// Initialize once

        export class InteractionService {

            /**
             * Orchestrates the DDI check, interacting with KGQ Agent and persisting results.
             * (ERA and EGA agent calls will be added here later).
             */
            async checkAndPersistInteractions(
                userId: string,
                patientProfileId: string,
                patientContext: PatientContextInput,
                existingMedications: MedicationInput[],
                newMedication: MedicationInput
            ): Promise<DDIAlert[]> {
                // --- 1. Create Prescription Records ---
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

                const createdPrescriptions = await Promise.all(
                    prescriptionsToCreate.map(prescription => 
                        prisma.prescription.create({ data: prescription })
                    )
                );

                // For simplicity, link alerts to the new medication's prescription ID if available
                const newMedPrescription = await prisma.prescription.findFirst({
                    where: {
                        patientProfileId: patientProfileId,
                        medicationId: newMedId,
                        type: 'NEW'
                    },
                    orderBy: { createdAt: 'desc' }
                });
                const mainPrescriptionId = newMedPrescription?.id;

                // --- 2. Call KGQ Agent ---
                const allMedNames = [...existingMedications.map(m => m.name), newMedication.name];
                const ddiResultsFromKG: DDIQueryResult[] = await kgqAgent.getDDIContext(allMedNames, patientContext);

                const alertsToReturn: DDIAlert[] = []; // Final alerts for frontend

                if (ddiResultsFromKG.length > 0) {
                    for (const kgResult of ddiResultsFromKG) {
                        const alertData = {
                            severity: 'High' as const,
                            drugA: kgResult.drugA,
                            drugB: kgResult.drugB,
                            explanation: `RAW KG RESULT (Mechanism: ${kgResult.mechanism}, Notes: ${kgResult.interactionNotes || 'N/A'}, Consequences: ${kgResult.clinicalConsequences.join(', ')}, Exacerbated by: ${kgResult.exacerbatedByCharacteristics.join(', ') || 'N/A'})`,
                            clinicalImplication: 'See raw KG result above. Further AI processing needed.',
                            recommendation: 'Further AI processing needed.'
                        };
                        alertsToReturn.push(alertData);

                        // --- 3. Persist InteractionAlert ---
                        await prisma.interactionAlert.create({
                            data: {
                                userId: userId,
                                patientProfileId: patientProfileId,
                                prescriptionId: mainPrescriptionId || createdPrescriptions[0]?.id || '00000000-0000-0000-0000-000000000000', // Use a valid UUID or fallback
                                alertData: alertData as any,
                                createdAt: new Date()
                            }
                        });
                    }
                } else {
                    // If no specific DDI found, create a 'no interaction' alert
                    const noAlertData = {
                        severity: 'Low' as const,
                        drugA: newMedication.name,
                        drugB: 'N/A',
                        explanation: 'No direct interaction found in KG for this MVP scope.',
                        clinicalImplication: 'No immediate high-risk DDI within MVP scope. Consult full clinical resources.',
                        recommendation: 'Continue monitoring per standard clinical practice.'
                    };
                    alertsToReturn.push(noAlertData);

                    await prisma.interactionAlert.create({
                        data: {
                            userId: userId,
                            patientProfileId: patientProfileId,
                            prescriptionId: mainPrescriptionId || createdPrescriptions[0]?.id || '00000000-0000-0000-0000-000000000000',
                            alertData: noAlertData as any,
                            createdAt: new Date()
                        }
                    });
                }
                return alertsToReturn;
            }
        }