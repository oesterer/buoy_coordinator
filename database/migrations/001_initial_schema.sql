CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE buoy_status AS ENUM ('idle', 'moving', 'holding', 'offline', 'low_battery', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE buoy_command AS ENUM ('MOVE_TO', 'HOLD_POSITION', 'RETURN_HOME', 'STOP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS buoys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  latitude double precision,
  longitude double precision,
  heading double precision,
  battery_level integer CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100)),
  status buoy_status NOT NULL DEFAULT 'offline',
  telemetry_timestamp timestamptz,
  home_latitude double precision,
  home_longitude double precision,
  pending_command buoy_command,
  command_target_latitude double precision,
  command_target_longitude double precision,
  command_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS racetracks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS racetrack_marks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  racetrack_id uuid NOT NULL REFERENCES racetracks(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  mark_type text NOT NULL,
  order_index integer NOT NULL,
  assigned_buoy_id uuid REFERENCES buoys(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (racetrack_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_racetrack_marks_racetrack_id ON racetrack_marks(racetrack_id);

INSERT INTO buoys (name, latitude, longitude, heading, battery_level, status, telemetry_timestamp, home_latitude, home_longitude)
VALUES
  ('Buoy 01', 37.8077, -122.4750, 82, 91, 'holding', now(), 37.8077, -122.4750),
  ('Buoy 02', 37.8058, -122.4697, 131, 78, 'idle', now(), 37.8058, -122.4697),
  ('Buoy 03', 37.8029, -122.4715, 264, 63, 'moving', now(), 37.8029, -122.4715)
ON CONFLICT DO NOTHING;

WITH track AS (
  INSERT INTO racetracks (name, description)
  VALUES ('Golden Gate Practice Triangle', 'Short windward-leeward practice course near Crissy Field.')
  RETURNING id
)
INSERT INTO racetrack_marks (racetrack_id, latitude, longitude, mark_type, order_index)
SELECT id, 37.8077, -122.4750, 'start', 0 FROM track
UNION ALL
SELECT id, 37.8058, -122.4697, 'windward', 1 FROM track
UNION ALL
SELECT id, 37.8029, -122.4715, 'leeward', 2 FROM track;
