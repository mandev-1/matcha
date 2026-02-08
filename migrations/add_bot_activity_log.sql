-- Bot activity log table
CREATE TABLE IF NOT EXISTS bot_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bot_id INTEGER NOT NULL,
    bot_username TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_user_id INTEGER,
    target_username TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bot_activity_bot_id ON bot_activity_log(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_activity_created_at ON bot_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_activity_action_type ON bot_activity_log(action_type);
