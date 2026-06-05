ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device_info TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
