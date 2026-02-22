const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
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

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'run-admin-farm-migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migrations:');
    console.log('  1. AddAdminFarmFields (1739000000000)');
    console.log('  2. CreateFarmModeratorsJunctionTable (1739100000000)');
    console.log('---');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('---');
    console.log('✅ Migrations completed successfully!');
    console.log('✅ Admin farm fields added (city, region, country, description)');
    console.log('✅ Farm moderators junction table created');
    console.log('✅ Existing JSONB data migrated (if any)');

    // Verify the changes
    const farmsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'farms' 
      AND column_name IN ('city', 'region', 'country', 'description')
      ORDER BY column_name
    `);

    const junctionTable = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'farm_moderators'
      )
    `);

    console.log('\n📊 Verification:');
    console.log(`  - Farms metadata columns: ${farmsColumns.rows.length} found`);
    console.log(`  - Junction table exists: ${junctionTable.rows[0].exists ? 'Yes' : 'No'}`);

    if (farmsColumns.rows.length === 4 && junctionTable.rows[0].exists) {
      console.log('\n✅ All migrations applied successfully!');
    } else {
      console.log('\n⚠️  Some migrations may not have been applied. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

runMigrations();














