-- Add optional fields to users for Settings / Users management
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
-- Allow permissions to store JSON array (e.g. ["dashboard","daily-entry"])
ALTER TABLE users ALTER COLUMN permissions TYPE TEXT;
