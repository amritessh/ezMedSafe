// src/routes/interactions.ts
import express, { RequestHandler } from 'express';
import { KGQAgent } from '../agents/kgqAgent';
import { PatientContextInput, MedicationInput, DDIAlert } from '../types';

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

// POST /api/check-interactions - Now protected by authMiddleware applied in server.ts
router.post('/', (async (req, res) => {
  const {
    patientContext,
    existingMedications,
    newMedication
  }: { patientContext: PatientContextInput, existingMedications: MedicationInput[], newMedication: MedicationInput } = req.body;

  // Access user ID from request object (set by authMiddleware)
  const userId = req.user?.id;
  if (!userId) {
      // This should ideally not happen if authMiddleware is correctly applied
      return res.status(401).json({ error: 'Authentication required for this operation.' });
  }

  if (!patientContext || !existingMedications || !newMedication || !newMedication.name) {
    return res.status(400).json({ error: 'Missing required fields: patientContext, existingMedications (array), newMedication (object with name)' });
  }

  try {
    const allMedNames = [...existingMedications.map(m => m.name), newMedication.name];

    // --- CALL KGQ AGENT ---
    const ddiResultsFromKG = await kgqAgent.getDDIContext(allMedNames, patientContext);

    const alerts: DDIAlert[] = [];

    // For MVP, just return the raw results from KGQ for now to verify Day 2 progress
    // Persistence to Prisma InteractionAlerts table will be added on Day 5
    if (ddiResultsFromKG.length > 0) {
        ddiResultsFromKG.forEach(kgResult => {
            alerts.push({
                severity: 'High',
                drugA: kgResult.drugA,
                drugB: kgResult.drugB,
                explanation: `RAW KG RESULT (Mechanism: ${kgResult.mechanism}, Notes: ${kgResult.interactionNotes || 'N/A'}, Consequences: ${kgResult.clinicalConsequences.join(', ')}, Exacerbated by: ${kgResult.exacerbatedByCharacteristics.join(', ') || 'N/A'})`,
                clinicalImplication: 'See raw KG result above. Further AI processing needed.',
                recommendation: 'Further AI processing needed.'
            });
        });
    } else {
        alerts.push({
            severity: 'Low',
            drugA: newMedication.name,
            drugB: 'N/A',
            explanation: 'No direct interaction found in KG for this MVP scope.',
            clinicalImplication: 'No immediate high-risk DDI within MVP scope. Consult full clinical resources.',
            recommendation: 'Continue monitoring per standard clinical practice.'
        });
    }

    res.json({ alerts });

  } catch (error) {
    console.error('Error checking interactions:', error);
    res.status(500).json({ error: 'Internal server error during interaction check' });
  }
}) as RequestHandler);

export default router;