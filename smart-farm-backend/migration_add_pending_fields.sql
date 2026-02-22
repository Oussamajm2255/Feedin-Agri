-- ============================================================================
-- MIGRATION SCRIPT: Add Pending Status and Onboarding Fields
-- 
-- Description: 
-- 1. Updates the user_status_enum to include 'pending'.
-- 2. Adds new columns for farm details (region, farm_type, area_hectares) to the users table.
-- 
-- Execution: Run this script against your PostgreSQL database.
-- ============================================================================

-- 1. Add 'pending' to the user_status_enum type
-- Postgres does not support "IF NOT EXISTS" for enum values directly in all versions, 
-- but this command is safe to run if the value doesn't exist.
-- If it fails saying it exists, you can ignore the error or wrap in a DO block.
ALTER TYPE user_status_enum ADD VALUE IF NOT EXISTS 'pending';

-- 2. Add new columns to the users table
-- We use IF NOT EXISTS to make the script idempotent (can be run multiple times safely).

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS farm_type VARCHAR(50),  -- e.g., 'small', 'commercial', 'cooperative'
ADD COLUMN IF NOT EXISTS area_hectares DECIMAL(10, 2);

-- 3. Optional: Add a comment to the columns for documentation
COMMENT ON COLUMN users.status IS 'User account status: active, inactive, suspended, pending';
COMMENT ON COLUMN users.farm_type IS 'Type of farm: small, commercial, cooperative';
COMMENT ON COLUMN users.area_hectares IS 'Farm area in hectares';

-- ============================================================================
-- Verification Query (Optional - Run to verify changes)
-- ============================================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users';
