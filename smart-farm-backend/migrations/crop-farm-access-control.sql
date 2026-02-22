-- ============================================================================
-- Migration: Crop-Farm Access Control Rules (Fixed Dependencies)
-- ============================================================================
-- Version: 1.1
-- Created: 2026-01-03
-- 
-- This migration implements the following business rules:
-- - Rule 1: Crops belong directly to a Farm (farm_id required on crops)
-- - Rule 2: Crops have NO relationship with Sensors (remove crop_id from sensors)
-- - Rule 3: Farm Owners see only crops on farms they own
-- - Rule 4: Farm Moderators see only crops on farms they moderate
-- - Rule 5: Admins see all crops with grouping capabilities
-- ============================================================================

-- ============================================================================
-- STEP 0: Drop dependent views
-- ============================================================================

-- v_farm_statistics depends on sensors.crop_id column
DROP VIEW IF EXISTS v_farm_statistics CASCADE;

-- ============================================================================
-- STEP 1: Add farm_id column to crops table
-- ============================================================================

-- Add farm_id column (nullable first to handle existing data)
ALTER TABLE crops ADD COLUMN IF NOT EXISTS farm_id VARCHAR(36);

-- ============================================================================
-- STEP 2: Handle existing crops data
-- ============================================================================

-- Option A: If you have existing crops without farm_id, you need to assign them
-- This query finds crops that have sensors assigned and gets the farm from sensor
UPDATE crops c
SET farm_id = (
    SELECT DISTINCT s.farm_id 
    FROM sensors s 
    WHERE s.crop_id = c.crop_id 
    LIMIT 1
)
WHERE c.farm_id IS NULL 
  AND EXISTS (SELECT 1 FROM sensors s WHERE s.crop_id = c.crop_id);

-- Option B: For crops without any sensor association, assign to first available farm
-- (This is a fallback to prevent data loss or constraint violations)
-- UPDATE crops 
-- SET farm_id = (SELECT farm_id FROM farms LIMIT 1)
-- WHERE farm_id IS NULL;

-- ============================================================================
-- STEP 3: Make farm_id NOT NULL after data migration (Optional)
-- ============================================================================

-- Delete any orphan crops that don't have a farm (optional - only if you want to enforce strict integrity)
-- DELETE FROM crops WHERE farm_id IS NULL;

-- Add NOT NULL constraint (only run after ensuring all crops have farm_id)
-- ALTER TABLE crops ALTER COLUMN farm_id SET NOT NULL;

-- ============================================================================
-- STEP 4: Add foreign key constraint
-- ============================================================================

ALTER TABLE crops 
ADD CONSTRAINT fk_crops_farm 
FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 5: Remove crop_id from sensors table
-- ============================================================================

-- First, drop the foreign key constraint if it exists
ALTER TABLE sensors DROP CONSTRAINT IF EXISTS fk_sensors_crop;

-- Then remove the crop_id column
ALTER TABLE sensors DROP COLUMN IF EXISTS crop_id;

-- ============================================================================
-- STEP 6: Add index for performance
-- ============================================================================

-- Index on farm_id for faster crop lookups by farm
CREATE INDEX IF NOT EXISTS idx_crops_farm_id ON crops(farm_id);

-- Index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_crops_farm_status ON crops(farm_id, status);

-- ============================================================================
-- STEP 7: Recreate dependent views
-- ============================================================================

-- Recreate v_farm_statistics with new relationship logic (Crops -> Farms directly)
CREATE OR REPLACE VIEW v_farm_statistics AS
SELECT
    f.farm_id,
    f.name AS farm_name,
    f.status AS farm_status,
    f.city,
    f.region,
    f.country,
    f.area_hectares,
    u.first_name || ' ' || u.last_name AS owner_name,
    COUNT(DISTINCT c.crop_id) AS total_crops,
    COUNT(DISTINCT d.device_id) AS total_devices,
    COUNT(DISTINCT CASE WHEN d.status = 'online' THEN d.device_id END) AS online_devices,
    COUNT(DISTINCT s.sensor_id) AS total_sensors,
    COUNT(DISTINCT CASE WHEN c.status = 'growing' THEN c.crop_id END) AS active_crops,
    MAX(sr.created_at) AS last_reading_at,
    COUNT(DISTINCT CASE WHEN n.is_read = FALSE AND n.level IN ('critical') THEN n.id END) AS unread_critical_notifications
FROM farms f
LEFT JOIN users u ON f.owner_id = u.user_id
LEFT JOIN devices d ON f.farm_id = d.farm_id
LEFT JOIN sensors s ON f.farm_id = s.farm_id
LEFT JOIN crops c ON f.farm_id = c.farm_id  -- UPDATED: Direct join to crops via farm_id
LEFT JOIN sensor_readings sr ON s.sensor_id = sr.sensor_id
LEFT JOIN notifications n ON u.user_id = n.user_id
GROUP BY f.farm_id, f.name, f.status, f.city, f.region, f.country, f.area_hectares, u.first_name, u.last_name;

-- ============================================================================
-- STEP 8: Update comments
-- ============================================================================

COMMENT ON COLUMN crops.farm_id IS 'Foreign key to farms table - every crop MUST belong to a farm';
COMMENT ON TABLE crops IS 'Stores crop information. Business Rules: (1) Every crop belongs to a farm, (2) Crops have no direct sensor relationship, (3) Access controlled via farm ownership/moderation';
