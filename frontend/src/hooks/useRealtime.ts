import { useEffect } from 'react';
import type { Buoy, Racetrack } from '../types';

type RealtimeMessage =
  | { type: 'connected' }
  | { type: 'buoy.created'; buoy: Buoy }
  | { type: 'buoy.updated'; buoy: Buoy }
  | { type: 'racetrack.created'; racetrack: Racetrack }
  | { type: 'racetrack.updated'; racetrack: Racetrack }
  | { type: 'racetrack.deleted'; id: string };

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:4000/ws';

export function useRealtime(onMessage: (message: RealtimeMessage) => void) {
  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onmessage = (event) => {
      onMessage(JSON.parse(event.data) as RealtimeMessage);
    };

    return () => socket.close();
  }, [onMessage]);
}
