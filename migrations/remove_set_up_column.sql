-- Migration: Remove redundant set_up column
-- Run this if you have an existing database

-- Note: SQLite doesn't support DROP COLUMN directly in older versions
-- If you're using SQLite 3.35.0+, you can use:
-- ALTER TABLE users DROP COLUMN set_up;

-- For older SQLite versions, you'll need to recreate the table:
-- This is a complex operation, so we'll just document it here
-- The set_up column will be ignored in queries going forward

