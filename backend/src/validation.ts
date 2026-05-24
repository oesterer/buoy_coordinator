import { z } from 'zod';

export const buoyStatusSchema = z.enum(['idle', 'moving', 'holding', 'offline', 'low_battery', 'error']);
export const buoyCommandSchema = z.enum(['MOVE_TO', 'HOLD_POSITION', 'RETURN_HOME', 'STOP']);

export const telemetrySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360),
  batteryLevel: z.number().int().min(0).max(100),
  status: buoyStatusSchema,
  timestamp: z.string().datetime().optional()
});

export const buoyInputSchema = z.object({
  name: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  homeLatitude: z.number().min(-90).max(90).nullable().optional(),
  homeLongitude: z.number().min(-180).max(180).nullable().optional()
});

export const racetrackMarkSchema = z.object({
  id: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  markType: z.string().min(1).max(80),
  orderIndex: z.number().int().min(0),
  assignedBuoyId: z.string().uuid().nullable().optional()
});

export const racetrackInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(''),
  marks: z.array(racetrackMarkSchema).min(1)
});

export const commandInputSchema = z.object({
  command: buoyCommandSchema,
  targetLatitude: z.number().min(-90).max(90).optional(),
  targetLongitude: z.number().min(-180).max(180).optional()
}).refine((value) => {
  if (value.command !== 'MOVE_TO') return true;
  return value.targetLatitude !== undefined && value.targetLongitude !== undefined;
}, 'MOVE_TO requires targetLatitude and targetLongitude');
