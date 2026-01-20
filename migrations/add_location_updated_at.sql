-- Add location_updated_at column to track when location was last updated
ALTER TABLE users ADD COLUMN location_updated_at DATETIME;

-- Update existing rows that have location data to set location_updated_at to updated_at
UPDATE users 
SET location_updated_at = updated_at 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;


