import express, { Request, Response } from 'express';
import { AuthService } from '../services/authService'; // Import the new service
import { validate, loginSchema } from '../middleware/validationMiddleware';

const router = express.Router();
const authService = new AuthService(); // Initialize the service

// POST /api/auth/login - for frontend to verify API key
router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { apiKey } = req.body;

  try {
    const userId = await authService.verifyApiKey(apiKey);

    if (!userId) {
      res.status(401).json({ error: 'Invalid API Key' });
      return;
    }

    res.status(200).json({ message: 'Login successful', userId: userId });
  } catch (error) {
    console.error('Error during login attempt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TEMPORARY: Endpoint to create a new user for development/testing
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { apiKey } = req.body;

  if (!apiKey) {
    res.status(400).json({ error: 'API Key is required' });
    return;
  }

  try {
    const newUser = await authService.createUser(apiKey);
    res.status(201).json({ message: 'User created successfully', userId: newUser.id, apiKey: newUser.apiKey });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;