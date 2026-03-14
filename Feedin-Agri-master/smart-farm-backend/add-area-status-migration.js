const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  const dbName = process.env.DB_NAME;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT || 5432;
  const dbUser = process.env.DB_USER;
  const dbPass = process.env.DB_PASS;

  let client;

  try {
    // Use DATABASE_URL if available, otherwise use individual params
    if (databaseUrl) {
      client = new Client({
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false
        }
      });
    } else if (dbHost && dbUser && dbPass && dbName) {
      client = new Client({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPass,
        database: dbName,
        ssl: {
          rejectUnauthorized: false
        }
      });
    } else {
      throw new Error('Database connection information not found in environment variables');
    }

    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully!');

    console.log('\n=== Running Migration: Add Area and Status to Farms ===\n');

    // Step 1: Add area_hectares column
    console.log('1. Adding area_hectares column...');
    await client.query(`
      ALTER TABLE "farms" 
      ADD COLUMN IF NOT EXISTS "area_hectares" DECIMAL(10, 2) NULL
    `);
    console.log('   ✅ area_hectares column added');

    // Step 2: Add status column
    console.log('2. Adding status column...');
    await client.query(`
      ALTER TABLE "farms" 
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NULL DEFAULT 'active'
    `);
    console.log('   ✅ status column added');

    // Step 3: Update existing rows
    console.log('3. Updating existing farms to have active status...');
    const updateResult = await client.query(`
      UPDATE "farms" 
      SET "status" = 'active' 
      WHERE "status" IS NULL
    `);
    console.log(`   ✅ Updated ${updateResult.rowCount} farms`);

    // Step 4: Create index
    console.log('4. Creating index on status column...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_farms_status" 
      ON "farms" ("status")
    `);
    console.log('   ✅ Index created');

    console.log('\n=== Migration Completed Successfully! ===\n');

    // Verification
    console.log('Verifying migration...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'farms' 
      AND column_name IN ('area_hectares', 'status')
      ORDER BY column_name
    `);

    console.log('\nColumns added:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });

    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_farms, 
        COUNT(area_hectares) as farms_with_area,
        COUNT(status) as farms_with_status,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_farms,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_farms
      FROM farms
    `);

    const stats = statsResult.rows[0];
    console.log('\nFarm statistics:');
    console.log(`   - Total farms: ${stats.total_farms}`);
    console.log(`   - Farms with area: ${stats.farms_with_area}`);
    console.log(`   - Farms with status: ${stats.farms_with_status}`);
    console.log(`   - Active farms: ${stats.active_farms}`);
    console.log(`   - Inactive farms: ${stats.inactive_farms}`);

    console.log('\n✅ Migration verification complete!\n');

  } catch (error) {
    console.error('\n❌ Error running migration:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
runMigration();

