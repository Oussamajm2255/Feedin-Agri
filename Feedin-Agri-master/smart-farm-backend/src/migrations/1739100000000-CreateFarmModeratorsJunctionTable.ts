import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Create Farm Moderators Junction Table
 * 
 * This migration creates a proper many-to-many relationship between farms and moderators
 * using a junction table instead of a JSONB array.
 * 
 * Migration Order:
 * 1. Run 1739000000000-AddAdminFarmFields.ts first (adds city, region, country, description)
 * 2. Then run this migration (creates junction table)
 * 
 * This migration handles:
 * - Creating the farm_moderators junction table
 * - Migrating existing data from JSONB array (if it exists)
 * - Removing the JSONB column and index
 */
export class CreateFarmModeratorsJunctionTable1739100000000 implements MigrationInterface {
    name = 'CreateFarmModeratorsJunctionTable1739100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create junction table for farm-moderator many-to-many relationship
        await queryRunner.query(`
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
            )
        `);

        // Create indexes for efficient queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_moderators_farm" 
            ON "farm_moderators"("farm_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_farm_moderators_user" 
            ON "farm_moderators"("user_id")
        `);

        // Migrate existing data from JSONB array to junction table (if column exists)
        // Check if assigned_moderators column exists before migrating
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'farms' 
                AND column_name = 'assigned_moderators'
            )
        `);

        if (columnExists[0]?.exists) {
            // Migrate data from JSONB array to junction table
            await queryRunner.query(`
                INSERT INTO "farm_moderators" ("farm_id", "user_id")
                SELECT 
                    f.farm_id,
                    jsonb_array_elements_text(f.assigned_moderators)::VARCHAR(36) as user_id
                FROM "farms" f
                WHERE f.assigned_moderators IS NOT NULL 
                AND jsonb_array_length(f.assigned_moderators) > 0
                ON CONFLICT ("farm_id", "user_id") DO NOTHING
            `);

            // Remove the GIN index if it exists
            await queryRunner.query(`
                DROP INDEX IF EXISTS "IDX_farms_assigned_moderators"
            `);

            // Remove JSONB column from farms table
            await queryRunner.query(`
                ALTER TABLE "farms" 
                DROP COLUMN "assigned_moderators"
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-add JSONB column
        await queryRunner.query(`
            ALTER TABLE "farms" 
            ADD COLUMN IF NOT EXISTS "assigned_moderators" jsonb DEFAULT '[]'::jsonb
        `);

        // Migrate data back from junction table to JSONB array
        await queryRunner.query(`
            UPDATE "farms" f
            SET "assigned_moderators" = (
                SELECT jsonb_agg(fm.user_id)
                FROM "farm_moderators" fm
                WHERE fm.farm_id = f.farm_id
            )
            WHERE EXISTS (
                SELECT 1 FROM "farm_moderators" fm2 
                WHERE fm2.farm_id = f.farm_id
            )
        `);

        // Re-create GIN index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_farms_assigned_moderators" 
            ON "farms" USING GIN ("assigned_moderators")
        `);

        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_farm_moderators_user"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_farm_moderators_farm"
        `);

        // Drop junction table
        await queryRunner.query(`
            DROP TABLE IF EXISTS "farm_moderators"
        `);
    }
}

