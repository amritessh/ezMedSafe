import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import './tracing';
// import { authMiddleware } from './middleware/authMiddleware';
import medicationsRouter from './routes/medications';
import interactionsRouter from './routes/interactions';
import patientProfilesRouter from './routes/patientProfiles';
import alertHistoryRouter from './routes/alertHistory';
import cors from 'cors';
import { ZodError } from 'zod';
// Removed Kafka and Redis imports
import { getGenerativeModel, getEmbeddingModel } from './clients/geminiClient';
import client from 'prom-client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;


const register = new client.Registry();

// Register default metrics (e.g., process CPU usage, memory, etc.)
client.collectDefaultMetrics({ register });

// Example custom counter for API requests
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register], // Register with our custom registry
});

// Example custom histogram for request duration
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 3, 5, 10], // Buckets for response time (in seconds)
  registers: [register],
});

// Middleware to measure request duration
app.use((req, res, next) => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path; // Capture route if available
    httpRequestCounter.inc({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });
    end({
      method: req.method,
      route: route,
      status_code: res.statusCode,
    });
  });
  next();
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:80'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

app.use(express.json());

async function startServer() {
  try {
    console.log('--- Starting Server Initialization ---');

    getGenerativeModel();
    getEmbeddingModel();

    app.get('/health', (req, res) => {
      res.status(200).send('ezMedSafe Backend OK');
    });

    // Kafka and Redis initialization blocks are now removed
    // The server will directly proceed to setting up routes and listening

    console.log('All critical clients initialized. Setting up routes...');

    // Public routes
    app.use('/api/auth', authRouter);

    // Protected routes
    // app.use('/api', authMiddleware as express.RequestHandler);

    app.use('/api/medications', medicationsRouter);
    app.use('/api/check-interactions', interactionsRouter);
    app.use('/api/patient-profiles', patientProfilesRouter);
    app.use('/api/alerts/history', alertHistoryRouter);

    // Global Error Handling Middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global Error Handler caught:', err.stack);

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

      if (err.name === 'UnauthorizedError') {
        res.status(401).send('Unauthorized: Invalid token');
        return;
      }

      res.status(500).send('Internal Server Error: Something unexpected broke!');
    });

    app.listen(PORT, () => {
      console.log(`ezMedSafe Backend is running on port ${PORT}`);
    });

    console.log('--- Server Initialization Complete (listening for requests) ---');

  } catch (error) {
    console.error('Failed to start backend server due to initialization error:', error);
    process.exit(1);
  }
}

startServer();

// Removed Kafka and Redis disconnects
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, disconnecting clients...');
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, disconnecting clients...');
    process.exit(0);
});