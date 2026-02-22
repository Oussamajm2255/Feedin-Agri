-- Admin Notifications Table Migration
-- Creates the admin_notifications table for system-level intelligence

-- Create enum types if they don't exist (PostgreSQL)
DO $$ BEGIN
    CREATE TYPE admin_notification_severity AS ENUM ('critical', 'warning', 'info', 'success');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_notification_domain AS ENUM ('system', 'farms', 'devices', 'crops', 'users', 'automation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_notification_status AS ENUM ('new', 'acknowledged', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'info',
    domain VARCHAR(20) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    context JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    pinned_until_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP(6),
    resolved_at TIMESTAMP(6),
    acknowledged_by VARCHAR(36),
    resolved_by VARCHAR(36),
    
    -- Constraints
    CONSTRAINT chk_admin_notification_severity CHECK (severity IN ('critical', 'warning', 'info', 'success')),
    CONSTRAINT chk_admin_notification_domain CHECK (domain IN ('system', 'farms', 'devices', 'crops', 'users', 'automation')),
    CONSTRAINT chk_admin_notification_status CHECK (status IN ('new', 'acknowledged', 'resolved'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_severity ON admin_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_domain ON admin_notifications(domain);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_pinned ON admin_notifications(pinned_until_resolved) WHERE pinned_until_resolved = TRUE;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);

-- Composite index for common list query pattern
CREATE INDEX IF NOT EXISTS idx_admin_notifications_list ON admin_notifications(pinned_until_resolved DESC, status, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE admin_notifications IS 'System-level notifications for administrators - platform intelligence, not farmer alerts';
COMMENT ON COLUMN admin_notifications.type IS 'Notification type key, e.g., mqtt_disconnect, user_registered';
COMMENT ON COLUMN admin_notifications.severity IS 'Urgency level: critical (requires immediate attention), warning, info, success';
COMMENT ON COLUMN admin_notifications.domain IS 'Platform area: system, farms, devices, crops, users, automation';
COMMENT ON COLUMN admin_notifications.context IS 'JSON context with related entity IDs, suggested actions, raw payload';
COMMENT ON COLUMN admin_notifications.pinned_until_resolved IS 'If true, notification stays pinned at top until resolved (auto-set for critical)';
