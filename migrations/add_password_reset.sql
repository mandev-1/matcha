-- Password reset: 6-digit code, expiry, and token for forgot-password flow
ALTER TABLE users ADD COLUMN password_reset_code TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires_at DATETIME;
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
