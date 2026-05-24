export type BuoyStatus = 'idle' | 'moving' | 'holding' | 'offline' | 'low_battery' | 'error';
export type BuoyCommand = 'MOVE_TO' | 'HOLD_POSITION' | 'RETURN_HOME' | 'STOP';

export interface Buoy {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  batteryLevel: number | null;
  status: BuoyStatus;
  telemetryTimestamp: string | null;
  pendingCommand: BuoyCommand | null;
  commandTargetLatitude: number | null;
  commandTargetLongitude: number | null;
  commandUpdatedAt: string | null;
}

export interface RacetrackMark {
  id?: string;
  latitude: number;
  longitude: number;
  markType: string;
  orderIndex: number;
  assignedBuoyId?: string | null;
}

export interface Racetrack {
  id: string;
  name: string;
  description: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  marks: RacetrackMark[];
  createdAt: string;
  updatedAt: string;
}

export interface RacetrackDraft {
  id?: string;
  name: string;
  description: string;
  homeLatitude: number | null;
  homeLongitude: number | null;
  marks: RacetrackMark[];
}
