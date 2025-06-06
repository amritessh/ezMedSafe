import express from 'express';
import prisma from '../clients/prismaClient';

const router = express.Router();

// GET /api/alerts/history - Get all interaction alerts for the authenticated user
router.get('/', async (req: any, res: any) => {
  const userId = req.user?.id; // From authMiddleware

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing from token.' });
  }

  try {
    const alerts = await prisma.interactionAlert.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }, // Get most recent alerts first
      include: { // Include related data for display
        patientProfile: { select: { id: true, ageGroup: true, renalStatus: true, hepaticStatus: true, cardiacStatus: true } },
        prescription: { include: { medication: { select: { name: true } } } } // Include the new medication name from the prescription
      }
    });

    // Format alerts for frontend display
    const formattedAlerts = alerts.map(alert => ({
        id: alert.id,
        createdAt: alert.createdAt,
        // Use the JSON data directly. frontend will parse it.
        alertData: alert.alertData, // This is the DDIAlert object stored as JSON
        patientInfo: alert.patientProfile ?
                             `Age: ${alert.patientProfile.ageGroup || 'N/A'}, Renal: ${alert.patientProfile.renalStatus ? 'Yes' : 'No'}, Hepatic: ${alert.patientProfile.hepaticStatus ? 'Yes' : 'No'}, Cardiac: ${alert.patientProfile.cardiacStatus ? 'Yes' : 'No'}` : 'N/A',
        newMedicationName: alert.prescription?.medication?.name || 'N/A'
    }));

    res.json(formattedAlerts);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;