import express from 'express';
import { PatientContextInput, MedicationInput, DDIAlert } from '../types';
import { InteractionService } from '../services/interactionService'; // Import the new service
import prisma from '../clients/prismaClient'; // Needed for patient profile lookup if ID provided

// Extend Express Request interface to include the user property from authMiddleware
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

const router = express.Router();
const interactionService = new InteractionService(); // Initialize the service

// POST /api/check-interactions - Protected by authMiddleware
router.post('/', async (req: any, res: any) => {
  const {
    patientContext,
    existingMedications,
    newMedication,
    patientProfileId: frontendPatientProfileId
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
    // --- Handle Patient Profile (Create if new, or use existing) ---
    if (frontendPatientProfileId) {
        const existingProfile = await prisma.patientProfile.findUnique({
            where: { id: frontendPatientProfileId },
            select: { id: true, userId: true }
        });
        if (!existingProfile || existingProfile.userId !== userId) {
            return res.status(400).json({ error: 'Invalid or unauthorized patientProfileId.' });
        }
        currentPatientProfileId = existingProfile.id;
    } else {
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

    // --- Call InteractionService to handle the rest ---
    const alerts = await interactionService.checkAndPersistInteractions(
        userId,
        currentPatientProfileId,
        patientContext, // Pass patientContext for KGQAgent, even if profile ID is managed here
        existingMedications,
        newMedication
    );

    res.json({ alerts });

  } catch (error) {
    console.error('Error checking interactions and persisting:', error);
    res.status(500).json({ error: 'Internal server error during interaction check/persistence' });
  }
});

export default router;