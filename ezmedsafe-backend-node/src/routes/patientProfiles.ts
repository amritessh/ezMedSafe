// src/routes/patientProfiles.ts (updated)
import express, { Request, Response } from 'express';
import prisma from '../clients/prismaClient';
import { validate, patientContextSchema } from '../middleware/validationMiddleware'; // Import validation

const router = express.Router();

router.post('/', validate(patientContextSchema), async (req: Request, res: Response): Promise<void> => { // Apply validation
    const {ageGroup, renalStatus, hepaticStatus, cardiacStatus} = req.body;
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized: User ID missing from token.' });
        return;
    }

    try {
        const patientProfile = await prisma.patientProfile.create({
            data: {
                ageGroup,
                renalStatus,
                hepaticStatus,
                cardiacStatus,
                userId: userId,
            },
        });
        res.status(201).json(patientProfile);
    } catch (error) {
        console.error('Error creating patient profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/patient-profiles - Get all patient profiles for the authenticated user (no body validation needed)
router.get('/', async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({ error: 'Unauthorized: User ID missing from token.' });
        return;
    }

    try {
        const patientProfiles = await prisma.patientProfile.findMany({
            where: { userId: userId }
        });
        res.json(patientProfiles);
    } catch (error) {
        console.error('Error fetching patient profiles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;