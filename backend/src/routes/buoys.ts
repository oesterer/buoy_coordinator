import { Router } from 'express';
import { broadcast } from '../realtime.js';
import { buoyInputSchema, commandInputSchema, telemetrySchema } from '../validation.js';
import { createBuoy, getCommand, listBuoys, setCommand, updateTelemetry } from '../repositories/buoyRepository.js';
import { parseTelemetryCsv, toCsv, wantsCsv } from '../utils/csv.js';

export const buoyRouter = Router();

buoyRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listBuoys());
  } catch (error) {
    next(error);
  }
});

buoyRouter.post('/', async (req, res, next) => {
  try {
    const input = buoyInputSchema.parse(req.body);
    const buoy = await createBuoy(input);
    broadcast({ type: 'buoy.created', buoy });
    res.status(201).json(buoy);
  } catch (error) {
    next(error);
  }
});

buoyRouter.post('/:id/telemetry', async (req, res, next) => {
  try {
    const input = typeof req.body === 'string' ? parseTelemetryCsv(req.body) : req.body;
    const telemetry = telemetrySchema.parse(input);
    const buoy = await updateTelemetry(req.params.id, telemetry);
    if (!buoy) {
      res.status(404).json({ error: 'Buoy not found' });
      return;
    }

    broadcast({ type: 'buoy.updated', buoy });
    if (wantsCsv(req)) {
      res.type('text/csv').send(
        toCsv(
          ['id', 'name', 'latitude', 'longitude', 'heading', 'batteryLevel', 'status', 'telemetryTimestamp'],
          [buoy.id, buoy.name, buoy.latitude, buoy.longitude, buoy.heading, buoy.batteryLevel, buoy.status, buoy.telemetryTimestamp]
        )
      );
      return;
    }
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

    if (wantsCsv(req)) {
      res.type('text/csv').send(
        toCsv(
          ['command', 'targetLatitude', 'targetLongitude', 'updatedAt'],
          [command.command, command.targetLatitude, command.targetLongitude, command.updatedAt]
        )
      );
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
