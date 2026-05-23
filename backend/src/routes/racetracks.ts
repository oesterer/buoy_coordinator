import { Router } from 'express';
import { broadcast } from '../realtime.js';
import { createRacetrack, deleteRacetrack, listRacetracks, updateRacetrack } from '../repositories/racetrackRepository.js';
import { racetrackInputSchema } from '../validation.js';

export const racetrackRouter = Router();

racetrackRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listRacetracks());
  } catch (error) {
    next(error);
  }
});

racetrackRouter.post('/', async (req, res, next) => {
  try {
    const input = racetrackInputSchema.parse(req.body);
    const racetrack = await createRacetrack(input);
    broadcast({ type: 'racetrack.created', racetrack });
    res.status(201).json(racetrack);
  } catch (error) {
    next(error);
  }
});

racetrackRouter.put('/:id', async (req, res, next) => {
  try {
    const input = racetrackInputSchema.parse(req.body);
    const racetrack = await updateRacetrack(req.params.id, input);
    if (!racetrack) {
      res.status(404).json({ error: 'Racetrack not found' });
      return;
    }

    broadcast({ type: 'racetrack.updated', racetrack });
    res.json(racetrack);
  } catch (error) {
    next(error);
  }
});

racetrackRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteRacetrack(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Racetrack not found' });
      return;
    }

    broadcast({ type: 'racetrack.deleted', id: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
