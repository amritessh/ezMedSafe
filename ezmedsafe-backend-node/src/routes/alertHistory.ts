import express from 'express';
import prisma from '../clients/prismaClient';

const router = express.Router();

// GET /api/alerts/history - Get all interaction alerts for the authenticated user
router.get('/history', async (req: any, res: any) => {
  const userId = req.user?.id; // From authMiddleware

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User ID missing from token.' });
  }

  try {
    const alerts = await prisma.interactionAlert.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }, // Get most recent alerts first
      include: {
        patientProfile: { select: { id: true, ageGroup: true } },
        prescription: { 
          include: { 
            medication: { select: { name: true } } 
          } 
        }
      }
    });

    // Format alerts for frontend, if needed (example: flatten prescription medication names)
    const formattedAlerts = alerts.map(alert => ({
        id: alert.id,
        createdAt: alert.createdAt,
        alertData: alert.alertData, // The raw JSON of the alert
        patientInfo: alert.patientProfile ? `Patient (${alert.patientProfile.ageGroup})` : 'N/A',
        newMedicationName: alert.prescription?.medication?.name || 'N/A'
    }));

    res.json(formattedAlerts);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;