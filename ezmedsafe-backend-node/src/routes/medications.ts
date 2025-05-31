import express, { Request, Response, NextFunction } from 'express';
// import supabase from '../clients/supabaseClient';
import prisma from '../clients/prismaClient';

const router = express.Router();

// GET /api/medications
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const medications = await prisma.medication.findMany();
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;