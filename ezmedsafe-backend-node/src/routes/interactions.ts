import express from 'express';
import { KGQAgent } from '../agents/kgqAgent';
import { PatientContextInput, MedicationInput, DDIAlert, DDIQueryResult } from '../types';
import prisma from '../clients/prismaClient'; // Import Prisma client

// Extend Express Request interface to include the user property from authMiddleware
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

const router = express.Router();
const kgqAgent = new KGQAgent();

// POST /api/check-interactions - Protected by authMiddleware
router.post('/', async (req: any, res: any) => {
  const {
    patientContext, // Can be used to create/link PatientProfile
    existingMedications,
    newMedication,
    patientProfileId: frontendPatientProfileId // Optional: ID if selected/created in frontend
  }: { patientContext: PatientContextInput, existingMedications: MedicationInput[], newMedication: MedicationInput, patientProfileId?: string } = req.body;

  const userId = req.user?.id;
  if (!userId) {
      return res.status(401).json({ error: 'Authentication required for this operation.' });
  }

  if (!newMedication || !newMedication.name) {
    return res.status(400).json({ error: 'Missing required fields: newMedication name.' });
  }

  let currentPatientProfileId: string;
  try {
    // --- 1. Handle Patient Profile (Create if new, or use existing) ---
    if (frontendPatientProfileId) {
        // Use existing profile if ID is provided from frontend
        const existingProfile = await prisma.patientProfile.findUnique({
            where: { id: frontendPatientProfileId },
            select: { id: true, userId: true }
        });
        if (!existingProfile || existingProfile.userId !== userId) {
            return res.status(400).json({ error: 'Invalid or unauthorized patientProfileId.' });
        }
        currentPatientProfileId = existingProfile.id;
    } else {
        // Create a new patient profile (if not provided/new context)
        const newProfile = await prisma.patientProfile.create({
            data: {
                userId: userId,
                ageGroup: patientContext.age_group,
                renalStatus: patientContext.renal_status,
                hepaticStatus: patientContext.hepatic_status,
                cardiacStatus: patientContext.cardiac_status,
            }
        });
        currentPatientProfileId = newProfile.id;
    }

    // --- 2. Create Prescription Records ---
    const medicationRecords = await prisma.medication.findMany({
        where: {
            name: {
                in: [...existingMedications.map(m => m.name), newMedication.name]
            }
        }
    });

    // Map input names to found Prisma Medication IDs
    const getMedId = (name: string) => medicationRecords.find(m => m.name === name)?.id;

    const prescriptionsToCreate: { patientProfileId: string, medicationId: string, type: 'EXISTING' | 'NEW' }[] = [];

    for (const med of existingMedications) {
        const medId = getMedId(med.name);
        if (medId) {
            prescriptionsToCreate.push({ patientProfileId: currentPatientProfileId, medicationId: medId, type: 'EXISTING' });
        }
    }
    const newMedId = getMedId(newMedication.name);
    if (newMedId) {
        prescriptionsToCreate.push({ patientProfileId: currentPatientProfileId, medicationId: newMedId, type: 'NEW' });
    }

    const createdPrescriptions = await Promise.all(
        prescriptionsToCreate.map(prescription => 
            prisma.prescription.create({ data: prescription })
        )
    );

    // For simplicity, we'll link alerts to the new medication's prescription ID if available
    const newMedPrescription = createdPrescriptions.find(p => p.type === 'NEW');
    const mainPrescriptionId = newMedPrescription?.id;

    if (!mainPrescriptionId) {
        console.warn('Could not find prescription ID for new medication, alerts might not link correctly.');
    }

    // --- 3. Call KGQ Agent ---
    const allMedNames = [...existingMedications.map(m => m.name), newMedication.name];
    const ddiResultsFromKG: DDIQueryResult[] = await kgqAgent.getDDIContext(allMedNames, patientContext);

    const alertsToReturn: DDIAlert[] = []; // This will be the final alerts array

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

            // --- 4. Persist InteractionAlert (using Prisma) ---
            await prisma.interactionAlert.create({
                data: {
                    userId: userId,
                    patientProfileId: currentPatientProfileId,
                    prescriptionId: mainPrescriptionId || createdPrescriptions[0]?.id || '00000000-0000-0000-0000-000000000000', // Link alert, use a dummy ID if cannot find
                    alertData: alertData as any, // Cast to any as Prisma's Json type can be flexible
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
                patientProfileId: currentPatientProfileId,
                prescriptionId: mainPrescriptionId || createdPrescriptions[0]?.id || '00000000-0000-0000-0000-000000000000',
                alertData: noAlertData as any,
                createdAt: new Date()
            }
        });
    }

    res.json({ alerts: alertsToReturn });

  } catch (error) {
    console.error('Error checking interactions and persisting:', error);
    res.status(500).json({ error: 'Internal server error during interaction check/persistence' });
  }
});

export default router;