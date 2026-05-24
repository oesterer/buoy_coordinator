CREATE UNIQUE INDEX IF NOT EXISTS idx_buoys_lower_name_unique ON buoys (lower(name));
