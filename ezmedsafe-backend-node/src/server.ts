import express, { ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import { authMiddleware } from './middleware/authMiddleware';
import medicationsRouter from './routes/medications';
import interactionsRouter from './routes/interactions';
import patientProfilesRouter from './routes/patientProfiles';
import alertHistoryRouter from './routes/alertHistory';
import { initializeKafkaProducer,disconnectKafkaProducer } from './clients/kafkaClient';
import cors from 'cors';
import { ZodError } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

initializeKafkaProducer().catch((err) => {
  console.error('Failed to initialize Kafka producer:', err);
});


app.use(cors({
  origin: 'http://localhost:5173', // <--- This MUST EXACTLY match your Vite dev server URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // <--- Include OPTIONS for preflight requests
  allowedHeaders: ['Content-Type', 'X-API-Key'], // <--- Include your custom headers
}));

app.use(express.json()); 

app.get('/health', (req, res) => {
  res.status(200).send('ezMedSafe Backend OK');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, disconnecting Kafka producer...');
  disconnectKafkaProducer();
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('SIGINT received, disconnecting Kafka producer...');
  disconnectKafkaProducer();
  process.exit(0);
});

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api', authMiddleware as express.RequestHandler);

app.use('/api/medications', medicationsRouter);
app.use('/api/check-interactions', interactionsRouter);
app.use('/api/patient-profiles', patientProfilesRouter);
app.use('/api/alerts/history', alertHistoryRouter);


// app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error(err.stack); // Log the stack trace
//   res.status(500).send('Something broke!'); // Generic error response
// });

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  console.error(err.stack); // Log the stack trace for debugging

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
    return;
  }

  // Handle other types of errors
  if (err.name === 'UnauthorizedError') { // Example for JWT errors if you add them later
    res.status(401).send('Unauthorized: Invalid token');
    return;
  }

  // Default error handler
  res.status(500).json({ error: 'Internal Server Error' });
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`ezMedSafe Backend is running on port ${PORT}`);
});
