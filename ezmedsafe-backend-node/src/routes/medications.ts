import express, { Request, Response, NextFunction } from 'express';
// import supabase from '../clients/supabaseClient';
import prisma from '../clients/prismaClient';

const router = express.Router();

// GET /api/medications
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log('--> GET /api/medications endpoint hit'); // <-- ADD THIS LINE
  try {
    const medications = await prisma.medication.findMany();
    console.log('Medications fetched from Prisma:', medications); // <-- ADD THIS LINE to see data
    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;