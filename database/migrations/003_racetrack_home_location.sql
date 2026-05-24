ALTER TABLE racetracks
  ADD COLUMN IF NOT EXISTS home_latitude double precision,
  ADD COLUMN IF NOT EXISTS home_longitude double precision;

UPDATE racetracks
SET home_latitude = COALESCE(home_latitude, 37.8072),
    home_longitude = COALESCE(home_longitude, -122.4770),
    updated_at = now()
WHERE home_latitude IS NULL
   OR home_longitude IS NULL;
