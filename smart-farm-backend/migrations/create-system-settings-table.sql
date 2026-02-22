-- Migration: Create system_settings table
-- Description: Stores system-wide configuration settings
-- Date: 2025-01-XX

CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    settings JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on settings JSONB for faster queries
CREATE INDEX IF NOT EXISTS idx_system_settings_settings ON system_settings USING GIN (settings);

-- Insert default settings if table is empty
INSERT INTO system_settings (id, settings)
VALUES (
    'main',
    '{
        "general": {
            "site_name": "Smart Farm Management System",
            "contact_email": "admin@smartfarm.com",
            "maintenance_mode": false
        },
        "notifications": {
            "email_enabled": true,
            "sms_enabled": false
        },
        "security": {
            "session_timeout": 86400,
            "max_login_attempts": 5
        }
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE system_settings IS 'Stores system-wide configuration settings';
COMMENT ON COLUMN system_settings.id IS 'Primary key, typically "main" for single settings record';
COMMENT ON COLUMN system_settings.settings IS 'JSONB object containing all system settings';





