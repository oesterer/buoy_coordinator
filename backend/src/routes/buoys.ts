import { Router } from 'express';
import { broadcast } from '../realtime.js';
import { commandInputSchema, telemetrySchema } from '../validation.js';
import { getCommand, listBuoys, setCommand, updateTelemetry } from '../repositories/buoyRepository.js';

export const buoyRouter = Router();

buoyRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listBuoys());
  } catch (error) {
    next(error);
  }
});

buoyRouter.post('/:id/telemetry', async (req, res, next) => {
  try {
    const telemetry = telemetrySchema.parse(req.body);
    const buoy = await updateTelemetry(req.params.id, telemetry);
    if (!buoy) {
      res.status(404).json({ error: 'Buoy not found' });
      return;
    }

    broadcast({ type: 'buoy.updated', buoy });
    res.json(buoy);
  } catch (error) {
    next(error);
  }
});

buoyRouter.get('/:id/command', async (req, res, next) => {
  try {
    const command = await getCommand(req.params.id);
    if (!command) {
      res.status(404).json({ error: 'Buoy not found' });
      return;
    }

    res.json(command);
  } catch (error) {
    next(error);
  }
});

buoyRouter.post('/:id/commands', async (req, res, next) => {
  try {
    const input = commandInputSchema.parse(req.body);
    const buoy = await setCommand(req.params.id, input.command, input.targetLatitude, input.targetLongitude);
    if (!buoy) {
      res.status(404).json({ error: 'Buoy not found' });
      return;
    }

    broadcast({ type: 'buoy.updated', buoy });
    res.json(buoy);
  } catch (error) {
    next(error);
  }
});
