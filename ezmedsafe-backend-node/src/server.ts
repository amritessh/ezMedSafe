import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/authMiddleware';
import medicationsRouter from './routes/medications';
import interactionsRouter from './routes/interactions';

import cors from 'cors';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: 'http://localhost:5173', // <--- This MUST EXACTLY match your Vite dev server URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // <--- Include OPTIONS for preflight requests
  allowedHeaders: ['Content-Type', 'X-API-Key'], // <--- Include your custom headers
}));

app.use(express.json()); 

app.get('/health', (req, res) => {
  res.status(200).send('ezMedSafe Backend OK');
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api', authMiddleware as express.RequestHandler);

app.use('/api/medications', medicationsRouter);
app.use('/api/check-interactions', interactionsRouter);


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack); // Log the stack trace
  res.status(500).send('Something broke!'); // Generic error response
});

app.listen(PORT, () => {
  console.log(`ezMedSafe Backend is running on port ${PORT}`);
});
