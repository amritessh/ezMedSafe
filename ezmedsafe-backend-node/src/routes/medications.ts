import express, { Request, Response, NextFunction } from 'express';
import prisma from '../clients/prismaClient';
import { getRedisClient } from '../clients/redisClient'; // Import Redis client

const router = express.Router();

// Cache key for medications
const MEDICATIONS_CACHE_KEY = 'all_medications';
const MEDICATIONS_CACHE_TTL = 3600; // Cache for 1 hour (in seconds)

// GET /api/medications
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const redisClient = getRedisClient();
    let medications;

    // Try to get from cache first
    const cachedMedications = await redisClient.get(MEDICATIONS_CACHE_KEY);
    if (cachedMedications) {
      medications = JSON.parse(cachedMedications);
      console.log('Medications fetched from Redis cache.');
    } else {
      // If not in cache, fetch from Prisma (Supabase)
      medications = await prisma.medication.findMany();
      // Store in cache for future requests
      await redisClient.setEx(MEDICATIONS_CACHE_KEY, MEDICATIONS_CACHE_TTL, JSON.stringify(medications));
      console.log('Medications fetched from DB and cached in Redis.');
    }

    res.json(medications);
  } catch (error) {
    console.error('Error fetching medications (or Redis issue):', error);
    // If Redis fails, still try to serve from DB directly if possible, or pass error
    try {
        const medications = await prisma.medication.findMany(); // Fallback to DB
        res.json(medications);
        console.log('Medications fetched directly from DB (Redis fallback).');
    } catch (dbError) {
        console.error('Fallback to DB also failed:', dbError);
        next(dbError); // Pass error to global error handler
    }
  }
});

export default router;