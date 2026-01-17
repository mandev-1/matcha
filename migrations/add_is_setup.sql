-- Migration: Add is_setup column to users table
-- Run this if you have an existing database

-- Add is_setup column (defaults to 0)
ALTER TABLE users ADD COLUMN is_setup INTEGER DEFAULT 0;

