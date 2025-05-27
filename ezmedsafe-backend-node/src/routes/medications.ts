import express, { Request, Response, NextFunction } from 'express';
import supabase from '../clients/supabaseClient';

const router = express.Router();

// GET /api/medications
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase.from('medications').select('*');
    if (error) {
      console.error('Error fetching medications:', error);
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;