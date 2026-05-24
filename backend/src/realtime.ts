import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';

export type RealtimeMessage =
  | { type: 'buoy.created'; buoy: unknown }
  | { type: 'buoy.updated'; buoy: unknown }
  | { type: 'racetrack.created'; racetrack: unknown }
  | { type: 'racetrack.updated'; racetrack: unknown }
  | { type: 'racetrack.deleted'; id: string };

let wss: WebSocketServer | null = null;

export function attachRealtime(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected' }));
  });
}

export function broadcast(message: RealtimeMessage) {
  if (!wss) return;
  const payload = JSON.stringify(message);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
