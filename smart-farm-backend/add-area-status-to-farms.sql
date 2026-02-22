-- Add Area and Status Columns to Farms Table
-- Migration: 1739200000000-AddAreaAndStatusToFarms

BEGIN;

-- Add area_hectares column
ALTER TABLE "farms" 
ADD COLUMN IF NOT EXISTS "area_hectares" DECIMAL(10, 2) NULL;

-- Add status column with default value
ALTER TABLE "farms" 
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NULL DEFAULT 'active';

-- Update existing rows to have 'active' status if they don't have one
UPDATE "farms" 
SET "status" = 'active' 
WHERE "status" IS NULL;

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS "IDX_farms_status" 
ON "farms" ("status");

COMMIT;

-- Verification queries (optional - run these to verify the migration)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'farms' 
-- AND column_name IN ('area_hectares', 'status');

-- SELECT COUNT(*) as total_farms, 
--        COUNT(area_hectares) as farms_with_area,
--        COUNT(status) as farms_with_status,
--        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_farms,
--        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_farms
-- FROM farms;

