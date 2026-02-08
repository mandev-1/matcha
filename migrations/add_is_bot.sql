-- Add is_bot column to users table
ALTER TABLE users ADD COLUMN is_bot INTEGER DEFAULT 0;

-- Create index for faster bot queries
CREATE INDEX IF NOT EXISTS idx_users_is_bot ON users(is_bot);
