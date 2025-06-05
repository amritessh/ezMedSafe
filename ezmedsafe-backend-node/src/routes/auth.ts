import express from 'express';
import { AuthService } from '../services/authService'; // Import the new service
import { validate, loginSchema } from '../middleware/validationMiddleware'; // To be added in next step

const router = express.Router();
const authService = new AuthService(); // Initialize the service

// POST /api/auth/login - for frontend to verify API key
router.post('/login', validate(loginSchema), async (req: any, res: any) => {
  const { apiKey } = req.body;

  try {
    const userId = await authService.verifyApiKey(apiKey);

    if (!userId) {
      return res.status(401).json({ error: 'Invalid API Key' });
    }

    res.status(200).json({ message: 'Login successful', userId: userId });
  } catch (error) {
    console.error('Error during login attempt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;