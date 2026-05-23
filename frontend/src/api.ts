import type { Buoy, BuoyCommand, Racetrack, RacetrackDraft } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getRacetracks() {
  return request<Racetrack[]>('/api/racetracks');
}

export function createRacetrack(draft: RacetrackDraft) {
  return request<Racetrack>('/api/racetracks', {
    method: 'POST',
    body: JSON.stringify(draft)
  });
}

export function updateRacetrack(id: string, draft: RacetrackDraft) {
  return request<Racetrack>(`/api/racetracks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(draft)
  });
}

export function deleteRacetrack(id: string) {
  return request<void>(`/api/racetracks/${id}`, { method: 'DELETE' });
}

export function getBuoys() {
  return request<Buoy[]>('/api/buoys');
}

export function sendBuoyCommand(id: string, command: BuoyCommand, target?: { latitude: number; longitude: number }) {
  return request<Buoy>(`/api/buoys/${id}/commands`, {
    method: 'POST',
    body: JSON.stringify({
      command,
      targetLatitude: target?.latitude,
      targetLongitude: target?.longitude
    })
  });
}
