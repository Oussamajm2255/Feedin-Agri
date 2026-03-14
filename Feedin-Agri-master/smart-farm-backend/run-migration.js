// Run system settings migration script
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  // Get database connection from environment
  const databaseUrl = process.env.DATABASE_URL;
  const dbName = process.env.DB_NAME || 'railway';
  const dbHost = process.env.DB_HOST || 'shortline.proxy.rlwy.net';
  const dbPort = process.env.DB_PORT || 56736;
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPass = process.env.DB_PASS || process.env.DATABASE_URL?.match(/postgres:\/\/([^:]+):([^@]+)@/)?.[2];

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

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create-system-settings-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: create-system-settings-table.sql');
    console.log('---');

    // Execute the migration
    await client.query(migrationSQL);

    console.log('---');
    console.log('✅ Migration completed successfully!');
    console.log('✅ system_settings table created/updated');
    console.log('✅ Default settings inserted');

    // Verify the table was created
    const result = await client.query(`
      SELECT id, settings->'security'->>'session_timeout' as session_timeout 
      FROM system_settings 
      WHERE id = 'main'
    `);

    if (result.rows.length > 0) {
      console.log('\n📊 Current Settings:');
      console.log(`   Session Timeout: ${result.rows[0].session_timeout} seconds (${result.rows[0].session_timeout / 3600} hours)`);
    }

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

runMigration();

