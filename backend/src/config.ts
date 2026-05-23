import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://buoy:buoy_password@localhost:5432/buoy_coordinator',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173'
};
