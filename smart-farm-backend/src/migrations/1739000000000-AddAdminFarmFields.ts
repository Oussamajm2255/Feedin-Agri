import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add Admin Farm Fields
 * 
 * This migration adds metadata fields to the farms table.
 * 
 * Migration Order:
 * 1. Run this migration first (adds city, region, country, description)
 * 2. Then run 1739100000000-CreateFarmModeratorsJunctionTable.ts (creates junction table)
 * 
 * Note: assigned_moderators is NOT added here - it's handled by the junction table migration
 * to ensure proper many-to-many relationship with foreign key constraints.
 */
export class AddAdminFarmFields1739000000000 implements MigrationInterface {
    name = 'AddAdminFarmFields1739000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add metadata columns to farms table (only real farm information, NOT derived values)
        // Note: assigned_moderators is handled by junction table migration (1739100000000)
        await queryRunner.query(`
            ALTER TABLE "farms" 
            ADD COLUMN IF NOT EXISTS "city" varchar(100) NULL,
            ADD COLUMN IF NOT EXISTS "region" varchar(100) NULL,
            ADD COLUMN IF NOT EXISTS "country" varchar(100) NULL,
            ADD COLUMN IF NOT EXISTS "description" text NULL
        `);

        // Add indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_farms_city" 
            ON "farms" ("city")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_farms_country" 
            ON "farms" ("country")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_farms_country"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_farms_city"
        `);

        // Remove columns (only metadata, no derived fields)
        // Note: assigned_moderators is handled by junction table migration rollback
        await queryRunner.query(`
            ALTER TABLE "farms" 
            DROP COLUMN IF EXISTS "description",
            DROP COLUMN IF EXISTS "country",
            DROP COLUMN IF EXISTS "region",
            DROP COLUMN IF EXISTS "city"
        `);
    }
}

