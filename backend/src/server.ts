import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { attachRealtime } from './realtime.js';

const app = createApp();
const server = http.createServer(app);

attachRealtime(server);

server.listen(config.port, () => {
  console.log(`Buoy coordinator API listening on http://localhost:${config.port}`);
});
