import express from 'express';
import prisma from '../clients/prismaClient';

const router = express.Router();

// POST /api/auth/login - for frontend to verify API key
router.post('/login', async (req: any, res: any) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { apiKey: apiKey },
      select: { id: true }, // Only select ID for login verification
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    // In a real app, you might generate a JWT here. For MVP, just confirm validity.
    res.status(200).json({ message: 'Login successful', userId: user.id });
  } catch (error) {
    console.error('Error during login attempt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// You might add a /verify endpoint if login is stateful, but /login itself can serve for MVP API key validation.

export default router;