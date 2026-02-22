-- Run Admin Farm Migrations
-- Migration 1: Add Admin Farm Fields (1739000000000)
-- Migration 2: Create Farm Moderators Junction Table (1739100000000)

BEGIN;

-- ============================================
-- Migration 1: Add Admin Farm Fields
-- ============================================

-- Add metadata columns to farms table (only real farm information, NOT derived values)
ALTER TABLE "farms" 
ADD COLUMN IF NOT EXISTS "city" varchar(100) NULL,
ADD COLUMN IF NOT EXISTS "region" varchar(100) NULL,
ADD COLUMN IF NOT EXISTS "country" varchar(100) NULL,
ADD COLUMN IF NOT EXISTS "description" text NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "IDX_farms_city" 
ON "farms" ("city");

CREATE INDEX IF NOT EXISTS "IDX_farms_country" 
ON "farms" ("country");

-- ============================================
-- Migration 2: Create Farm Moderators Junction Table
-- ============================================

-- Create junction table for farm-moderator many-to-many relationship
CREATE TABLE IF NOT EXISTS "farm_moderators" (
    "farm_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "assigned_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("farm_id", "user_id"),
    CONSTRAINT "fk_farm_moderators_farm" 
        FOREIGN KEY ("farm_id") 
        REFERENCES "farms"("farm_id") 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "fk_farm_moderators_user" 
        FOREIGN KEY ("user_id") 
        REFERENCES "users"("user_id") 
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "idx_farm_moderators_farm" 
ON "farm_moderators"("farm_id");

CREATE INDEX IF NOT EXISTS "idx_farm_moderators_user" 
ON "farm_moderators"("user_id");

-- Migrate existing data from JSONB array to junction table (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'farms' 
        AND column_name = 'assigned_moderators'
    ) THEN
        -- Migrate data from JSONB array to junction table
        INSERT INTO "farm_moderators" ("farm_id", "user_id")
        SELECT 
            f.farm_id,
            jsonb_array_elements_text(f.assigned_moderators)::VARCHAR(36) as user_id
        FROM "farms" f
        WHERE f.assigned_moderators IS NOT NULL 
        AND jsonb_array_length(f.assigned_moderators) > 0
        ON CONFLICT ("farm_id", "user_id") DO NOTHING;

        -- Remove the GIN index if it exists
        DROP INDEX IF EXISTS "IDX_farms_assigned_moderators";

        -- Remove JSONB column from farms table
        ALTER TABLE "farms" 
        DROP COLUMN "assigned_moderators";
    END IF;
END $$;

-- Record migrations in migrations table (if not already recorded)
INSERT INTO "migrations"("timestamp", "name") 
VALUES 
    (1739000000000, 'AddAdminFarmFields1739000000000'),
    (1739100000000, 'CreateFarmModeratorsJunctionTable1739100000000')
ON CONFLICT DO NOTHING;

COMMIT;














