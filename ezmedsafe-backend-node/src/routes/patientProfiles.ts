import express from 'express';
import prisma from '../clients/prismaClient';
import { Prisma } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

const router = express.Router();

router.post('/', async (req: any, res: any) => {
    const {ageGroup, renalStatus, hepaticStatus, cardiacStatus} = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID missing from token.' });
    }

    try {
        const patientProfile = await prisma.patientProfile.create({
            data: {
                ageGroup,
                renalStatus,
                hepaticStatus,
                cardiacStatus,
                user: {
                    connect: { id: userId }
                }
            } as Prisma.PatientProfileCreateInput,
        });
        res.status(201).json(patientProfile);
    } catch (error) {
        console.error('Error creating patient profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/patient-profiles - Get all patient profiles for the authenticated user
router.get('/', async (req: any, res: any) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID missing from token.' });
    }

    try {
        const patientProfiles = await prisma.patientProfile.findMany({
            where: {
                user: {
                    id: userId
                }
            } as Prisma.PatientProfileWhereInput,
            orderBy: { id: 'desc' },
        });
        res.json(patientProfiles);
    } catch (error) {
        console.error('Error fetching patient profiles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;