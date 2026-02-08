-- Add related_user_id to notifications for navigation (e.g. to profile/chat)
ALTER TABLE notifications ADD COLUMN related_user_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_notifications_related_user ON notifications(related_user_id);
