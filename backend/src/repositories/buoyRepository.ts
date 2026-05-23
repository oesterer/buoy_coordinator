import { pool } from '../db.js';
import type { BuoyCommand } from '../types.js';
import { mapBuoy } from '../utils/rows.js';

export async function listBuoys() {
  const result = await pool.query('SELECT * FROM buoys ORDER BY name ASC');
  return result.rows.map(mapBuoy);
}

export async function updateTelemetry(id: string, telemetry: {
  latitude: number;
  longitude: number;
  heading: number;
  batteryLevel: number;
  status: string;
  timestamp?: string;
}) {
  const result = await pool.query(
    `UPDATE buoys
     SET latitude = $2,
         longitude = $3,
         heading = $4,
         battery_level = $5,
         status = $6,
         telemetry_timestamp = COALESCE($7::timestamptz, now()),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, telemetry.latitude, telemetry.longitude, telemetry.heading, telemetry.batteryLevel, telemetry.status, telemetry.timestamp ?? null]
  );

  return result.rows[0] ? mapBuoy(result.rows[0]) : null;
}

export async function getCommand(id: string) {
  const result = await pool.query(
    `SELECT pending_command, command_target_latitude, command_target_longitude, command_updated_at
     FROM buoys
     WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    command: row.pending_command as BuoyCommand | null,
    targetLatitude: row.command_target_latitude == null ? null : Number(row.command_target_latitude),
    targetLongitude: row.command_target_longitude == null ? null : Number(row.command_target_longitude),
    updatedAt: row.command_updated_at == null ? null : new Date(row.command_updated_at).toISOString()
  };
}

export async function setCommand(id: string, command: BuoyCommand, targetLatitude?: number, targetLongitude?: number) {
  const result = await pool.query(
    `UPDATE buoys
     SET pending_command = $2,
         command_target_latitude = $3,
         command_target_longitude = $4,
         command_updated_at = now(),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, command, targetLatitude ?? null, targetLongitude ?? null]
  );

  return result.rows[0] ? mapBuoy(result.rows[0]) : null;
}
