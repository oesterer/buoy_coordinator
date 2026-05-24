import type { Buoy, Racetrack, RacetrackMark } from '../types.js';

export function mapBuoy(row: Record<string, unknown>): Buoy {
  return {
    id: String(row.id),
    name: String(row.name),
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    heading: row.heading == null ? null : Number(row.heading),
    batteryLevel: row.battery_level == null ? null : Number(row.battery_level),
    status: row.status as Buoy['status'],
    telemetryTimestamp: row.telemetry_timestamp == null ? null : new Date(row.telemetry_timestamp as string).toISOString(),
    homeLatitude: row.home_latitude == null ? null : Number(row.home_latitude),
    homeLongitude: row.home_longitude == null ? null : Number(row.home_longitude),
    pendingCommand: row.pending_command as Buoy['pendingCommand'],
    commandTargetLatitude: row.command_target_latitude == null ? null : Number(row.command_target_latitude),
    commandTargetLongitude: row.command_target_longitude == null ? null : Number(row.command_target_longitude),
    commandUpdatedAt: row.command_updated_at == null ? null : new Date(row.command_updated_at as string).toISOString()
  };
}

export function mapMark(row: Record<string, unknown>): RacetrackMark {
  return {
    id: String(row.id),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    markType: String(row.mark_type),
    orderIndex: Number(row.order_index),
    assignedBuoyId: row.assigned_buoy_id == null ? null : String(row.assigned_buoy_id)
  };
}

export function mapRacetrack(row: Record<string, unknown>, marks: RacetrackMark[]): Racetrack {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    homeLatitude: row.home_latitude == null ? null : Number(row.home_latitude),
    homeLongitude: row.home_longitude == null ? null : Number(row.home_longitude),
    marks,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString()
  };
}
