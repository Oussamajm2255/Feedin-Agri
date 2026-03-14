import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add Area and Status to Farms
 * 
 * This migration adds the area_hectares and status columns to the farms table.
 * 
 * Migration Order:
 * 1. Run 1739000000000-AddAdminFarmFields.ts (adds city, region, country, description)
 * 2. Run 1739100000000-CreateFarmModeratorsJunctionTable.ts (creates junction table)
 * 3. Run this migration (adds area_hectares and status)
 */
export class AddAreaAndStatusToFarms1739200000000 implements MigrationInterface {
    name = 'AddAreaAndStatusToFarms1739200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add area_hectares column
        await queryRunner.query(`
            ALTER TABLE "farms" 
            ADD COLUMN IF NOT EXISTS "area_hectares" DECIMAL(10, 2) NULL
        `);

        // Add status column with default value
        await queryRunner.query(`
            ALTER TABLE "farms" 
            ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NULL DEFAULT 'active'
        `);

        // Update existing rows to have 'active' status if they don't have one
        await queryRunner.query(`
            UPDATE "farms" 
            SET "status" = 'active' 
            WHERE "status" IS NULL
        `);

        // Create index on status for better query performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_farms_status" 
            ON "farms" ("status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_farms_status"
        `);

        // Remove columns
        await queryRunner.query(`
            ALTER TABLE "farms" 
            DROP COLUMN IF EXISTS "status",
            DROP COLUMN IF EXISTS "area_hectares"
        `);
    }
}

