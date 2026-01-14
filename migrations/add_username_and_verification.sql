-- Migration: Add username, email_verification_token, and set_up columns
-- Run this if you have an existing database

-- Add username column (without UNIQUE constraint - we'll add index separately)
ALTER TABLE users ADD COLUMN username TEXT;

-- Add email_verification_token column
ALTER TABLE users ADD COLUMN email_verification_token TEXT;

-- Add set_up column
ALTER TABLE users ADD COLUMN set_up INTEGER DEFAULT 0;

-- Create unique index for username (this enforces uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

