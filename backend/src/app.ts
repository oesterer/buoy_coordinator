import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { config } from './config.js';
import { buoyRouter } from './routes/buoys.js';
import { racetrackRouter } from './routes/racetracks.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(express.text({ type: ['text/csv', 'application/csv'] }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/racetracks', racetrackRouter);
  app.use('/api/buoys', buoyRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.flatten() });
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
