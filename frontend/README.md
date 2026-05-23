# Buoy Coordinator Frontend

React + TypeScript + Vite app for planning RC sailing racetracks on a Leaflet/OpenStreetMap chart.

## Setup

```bash
cp .env.example .env
npm install
npm run dev --workspace frontend
```

Open `http://localhost:5173`.

## Runtime

- Uses browser geolocation for the initial map center.
- Falls back to San Francisco when geolocation is unavailable.
- Connects to the backend WebSocket at `VITE_WS_URL` for live buoy and racetrack updates.
- Uses `VITE_API_URL` for REST calls.
