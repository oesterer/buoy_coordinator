import { pool } from '../db.js';
import { mapMark, mapRacetrack } from '../utils/rows.js';
import type { RacetrackMark } from '../types.js';

interface RacetrackInput {
  name: string;
  description: string;
  marks: Array<{
    latitude: number;
    longitude: number;
    markType: string;
    orderIndex: number;
    assignedBuoyId?: string | null;
  }>;
}

async function getMarksByTrackIds(ids: string[]) {
  if (ids.length === 0) return new Map<string, RacetrackMark[]>();
  const result = await pool.query(
    'SELECT * FROM racetrack_marks WHERE racetrack_id = ANY($1::uuid[]) ORDER BY racetrack_id, order_index ASC',
    [ids]
  );

  const marksByTrack = new Map<string, RacetrackMark[]>();
  for (const row of result.rows) {
    const marks = marksByTrack.get(row.racetrack_id) ?? [];
    marks.push(mapMark(row));
    marksByTrack.set(row.racetrack_id, marks);
  }
  return marksByTrack;
}

export async function listRacetracks() {
  const tracks = await pool.query('SELECT * FROM racetracks ORDER BY updated_at DESC');
  const marksByTrack = await getMarksByTrackIds(tracks.rows.map((row) => row.id));
  return tracks.rows.map((row) => mapRacetrack(row, marksByTrack.get(row.id) ?? []));
}

export async function createRacetrack(input: RacetrackInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const trackResult = await client.query(
      'INSERT INTO racetracks (name, description) VALUES ($1, $2) RETURNING *',
      [input.name, input.description]
    );
    const track = trackResult.rows[0];

    for (const mark of input.marks) {
      await client.query(
        `INSERT INTO racetrack_marks (racetrack_id, latitude, longitude, mark_type, order_index, assigned_buoy_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [track.id, mark.latitude, mark.longitude, mark.markType, mark.orderIndex, mark.assignedBuoyId ?? null]
      );
    }

    await client.query('COMMIT');
    const marksByTrack = await getMarksByTrackIds([track.id]);
    return mapRacetrack(track, marksByTrack.get(track.id) ?? []);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateRacetrack(id: string, input: RacetrackInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const trackResult = await client.query(
      `UPDATE racetracks
       SET name = $2, description = $3, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, input.name, input.description]
    );
    const track = trackResult.rows[0];
    if (!track) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('DELETE FROM racetrack_marks WHERE racetrack_id = $1', [id]);
    for (const mark of input.marks) {
      await client.query(
        `INSERT INTO racetrack_marks (racetrack_id, latitude, longitude, mark_type, order_index, assigned_buoy_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, mark.latitude, mark.longitude, mark.markType, mark.orderIndex, mark.assignedBuoyId ?? null]
      );
    }

    await client.query('COMMIT');
    const marksByTrack = await getMarksByTrackIds([id]);
    return mapRacetrack(track, marksByTrack.get(id) ?? []);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteRacetrack(id: string) {
  const result = await pool.query('DELETE FROM racetracks WHERE id = $1 RETURNING id', [id]);
  return (result.rowCount ?? 0) > 0;
}
