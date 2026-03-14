# Smart Farm IoT - Ultimate Production Database Schema

## Overview

This is a production-ready PostgreSQL schema designed for long-term stability and performance. It is 100% compatible with the TypeORM backend entities and includes comprehensive optimizations, audit trails, and maintenance functions.

**Version:** 4.0  
**Database:** PostgreSQL 17+ (Optimized)  
**Compatibility:** 100% backend entity match  
**Last Updated:** 2025-12-26

---

## What's New in V4.0

### ✅ New Features

- **System Settings Table**: Global configuration stored as JSONB (`system_settings`)
- **Farm Moderators Junction Table**: Many-to-many relationship between farms and moderators (`farm_moderators`)
- **Extended Farms Metadata**: Added city, region, country, description, area_hectares, status fields
- **New Enum Types**: `action_status_enum`, `farm_status_enum`
- **Full 2025-2026 Partitions**: 18 months of pre-created partitions for `sensor_readings`
- **New View**: `v_farm_moderators` for farm-moderator relationships
- **Improved Partition Management**: New utility functions for partition statistics

---

## Schema Features

### ✅ Core Features

- **100% Backend Compatible**: Matches all TypeORM entities exactly
- **Partitioned Tables**: `sensor_readings` partitioned by month for optimal performance
- **Comprehensive Audit Trail**: All data changes logged automatically
- **Production Indexes**: 55+ optimized indexes including partial and GIN indexes
- **Materialized Views**: Pre-aggregated analytics for fast queries
- **Utility Functions**: Maintenance, cleanup, and health scoring functions
- **Data Integrity**: Extensive CHECK constraints and foreign keys
- **Zero Sample Data**: Clean schema ready for production

### 📊 Tables

| # | Table | Purpose |
|---|-------|---------|
| 1 | **users** | User accounts and authentication |
| 2 | **farms** | Farm information, ownership, and metadata |
| 3 | **farm_moderators** | Junction table for farm-moderator relationships |
| 4 | **crops** | Crop lifecycle tracking |
| 5 | **devices** | IoT device information |
| 6 | **sensors** | Sensor configuration and thresholds |
| 7 | **sensor_readings** | Time-series sensor data (partitioned) |
| 8 | **sensor_actuator_rules** | Automated action rules |
| 9 | **action_logs** | Complete action audit trail |
| 10 | **notifications** | User notifications |
| 11 | **system_settings** | Global system configuration |
| 12 | **migrations** | Migration tracking |
| 13 | **audit_logs** | Comprehensive audit trail |

### 🔧 Enum Types

| Type | Values | Used In |
|------|--------|---------|
| `user_role_enum` | admin, farmer, moderator | users.role |
| `user_status_enum` | active, inactive, suspended | users.status |
| `action_status_enum` | queued, sent, ack, error, timeout, failed | action_logs.status |
| `farm_status_enum` | active, inactive | farms.status |

---

## Installation

### 1. Run the Schema

```bash
psql -U postgres -d your_database -f smart_farm_schema.sql
```

### 2. Set Up Partition Management

```bash
psql -U postgres -d your_database -f partition-management.sql
```

### 3. Create Additional Partitions (Optional)

```sql
-- Create partitions for next 6 months
SELECT create_future_partitions(6);
```

---

## Entity-Table Mapping

### Users Table
**Entity:** `src/entities/user.entity.ts`

| Column | Type | Description |
|--------|------|-------------|
| user_id | VARCHAR(36) | Primary key |
| email | VARCHAR(100) | Unique email |
| password | VARCHAR(255) | Bcrypt hashed |
| first_name | VARCHAR(100) | Required |
| last_name | VARCHAR(100) | Required |
| phone | VARCHAR(20) | Optional |
| role | user_role_enum | admin/farmer/moderator |
| status | user_status_enum | active/inactive/suspended |
| address | TEXT | Optional |
| city | VARCHAR(100) | Optional |
| country | VARCHAR(100) | Optional |
| date_of_birth | DATE | Optional |
| gender | VARCHAR(10) | Optional |
| profile_picture | TEXT | URL |
| last_login | TIMESTAMP | Optional |
| reset_token | VARCHAR(255) | Password reset |
| reset_token_expires | TIMESTAMP | Token expiry |
| created_at | TIMESTAMP(6) | Auto |
| updated_at | TIMESTAMP(6) | Auto |

### Farms Table
**Entity:** `src/modules/farms/farm.entity.ts`

| Column | Type | Description |
|--------|------|-------------|
| farm_id | VARCHAR(36) | Primary key |
| name | VARCHAR(100) | Required |
| location | TEXT | Address |
| latitude | DECIMAL(10,8) | GPS coordinate |
| longitude | DECIMAL(11,8) | GPS coordinate |
| owner_id | VARCHAR(36) | FK to users |
| city | VARCHAR(100) | Admin metadata |
| region | VARCHAR(100) | Admin metadata |
| country | VARCHAR(100) | Admin metadata |
| description | TEXT | Admin metadata |
| area_hectares | DECIMAL(10,2) | Farm size |
| status | farm_status_enum | active/inactive |
| created_at | TIMESTAMP(6) | Auto |
| updated_at | TIMESTAMP(6) | Auto |

### Farm Moderators Table
**Entity:** ManyToMany in `farm.entity.ts`

| Column | Type | Description |
|--------|------|-------------|
| farm_id | VARCHAR(36) | FK to farms (PK) |
| user_id | VARCHAR(36) | FK to users (PK) |
| assigned_at | TIMESTAMP(6) | When assigned |

### System Settings Table
**Entity:** `src/entities/system-settings.entity.ts`

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(50) | Primary key (default: 'main') |
| settings | JSONB | Configuration object |
| created_at | TIMESTAMP(6) | Auto |
| updated_at | TIMESTAMP(6) | Auto |

**Settings Structure:**
```json
{
  "general": {
    "site_name": "Smart Farm Management System",
    "contact_email": "admin@smartfarm.com",
    "maintenance_mode": false
  },
  "notifications": {
    "email_enabled": true,
    "sms_enabled": false
  },
  "security": {
    "session_timeout": 86400,
    "max_login_attempts": 5
  }
}
```

---

## Maintenance Tasks

### Daily Tasks

#### Refresh Materialized Views

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sensor_stats;
```

**Recommended:** Run daily at 1:00 AM via cron or scheduled job.

### Monthly Tasks

#### Create Next Month's Partition

```sql
SELECT create_next_month_partition();
```

**Recommended:** Run on the 25th of each month to create next month's partition.

#### Create Multiple Future Partitions

```sql
-- Create partitions for next 6 months
SELECT create_future_partitions(6);
```

### Quarterly Tasks

#### Cleanup Old Data

```sql
-- Cleanup sensor readings older than 90 days
SELECT cleanup_old_sensor_readings(90);

-- Cleanup read notifications older than 30 days
SELECT cleanup_old_notifications(30);
```

#### Drop Old Partitions

```sql
-- Drop partitions older than 12 months
SELECT drop_old_partitions(12);
```

**Recommended:** Keep at least 12 months of data for historical analysis.

---

## Performance Optimization

### Indexes

The schema includes 55+ optimized indexes:

- **Standard Indexes**: On foreign keys, status fields, timestamps
- **Partial Indexes**: Only index active/enabled records (saves space)
- **GIN Indexes**: For text search (farms.name, devices.name)
- **Composite Indexes**: Multi-column indexes for common query patterns
- **JSONB Indexes**: For notification context and system settings searches

### Partitioning

The `sensor_readings` table is partitioned by month:

- **Benefits**: Faster queries, easier maintenance, automatic data archiving
- **Strategy**: Monthly partitions (can be changed to weekly for high-volume)
- **Pre-created**: 2025-01 to 2026-06 (18 months)
- **Management**: Use provided partition management functions

### Materialized Views

`mv_daily_sensor_stats` provides pre-aggregated daily statistics:

- **Refresh**: Daily (CONCURRENTLY to avoid locking)
- **Retention**: 90 days of aggregated data
- **Use Case**: Fast analytics and reporting

---

## Utility Functions

### Sensor Analytics

```sql
-- Get average sensor readings for last 24 hours
SELECT * FROM get_sensor_average('sensor-123', 24);

-- Get average for last 7 days
SELECT * FROM get_sensor_average('sensor-123', 168);
```

### Farm Health

```sql
-- Get comprehensive health score for a farm
SELECT * FROM get_farm_health_score('farm-001');
```

Returns:
- `health_score`: Overall health (0-100)
- `online_devices_pct`: Percentage of online devices
- `active_sensors_pct`: Percentage of active sensors
- `recent_violations_count`: Violations in last 24 hours

### Data Cleanup

```sql
-- Cleanup old sensor readings (keeps 90 days)
SELECT cleanup_old_sensor_readings(90);

-- Cleanup old notifications (keeps 30 days)
SELECT cleanup_old_notifications(30);
```

### Partition Management

```sql
-- Create next month's partition
SELECT create_next_month_partition();

-- Create partitions for next 6 months
SELECT create_future_partitions(6);

-- Drop partitions older than 12 months
SELECT drop_old_partitions(12);

-- List all partitions with statistics
SELECT * FROM list_sensor_reading_partitions();

-- Get overall partition statistics
SELECT * FROM get_partition_statistics();

-- Ensure current month partition exists
SELECT ensure_current_partition();
```

---

## Views

### Standard Views

1. **v_recent_sensor_readings** - Recent readings with device/farm context
2. **v_active_alerts** - Unread critical/warning notifications
3. **v_farm_statistics** - Comprehensive farm metrics
4. **v_sensor_health** - Sensor health status and violations
5. **v_device_status_summary** - Device status by farm
6. **v_threshold_violations_24h** - Recent threshold violations
7. **v_unread_notifications_summary** - Unread notifications by user
8. **v_farm_moderators** - Farm and moderator relationships

### Materialized Views

1. **mv_daily_sensor_stats** - Pre-aggregated daily sensor statistics

**Usage:**
```sql
-- Query materialized view (fast)
SELECT * FROM mv_daily_sensor_stats 
WHERE reading_date >= CURRENT_DATE - INTERVAL '7 days';

-- Refresh (run daily)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sensor_stats;
```

---

## Security Best Practices

### 1. Database Roles

Create separate roles for different access levels:

```sql
-- Admin role (full access)
CREATE ROLE smartfarm_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartfarm_admin;

-- API role (read/write, no schema changes)
CREATE ROLE smartfarm_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartfarm_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smartfarm_api;

-- Read-only role (analytics, reporting)
CREATE ROLE smartfarm_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO smartfarm_readonly;
```

### 2. Connection Pooling

Use connection pooling (PgBouncer or similar) to:
- Limit concurrent connections
- Improve performance
- Reduce resource usage

### 3. Backup Strategy

**Daily Full Backup:**
```bash
pg_dump -U postgres -F c -b -v -f "smartfarm_backup_$(date +%Y%m%d).backup" smartfarm_db
```

**Weekly Sensor Readings Backup:**
```bash
pg_dump -U postgres -t sensor_readings -F c -f "sensor_readings_$(date +%Y%m%d).backup" smartfarm_db
```

**Retention Policy:**
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

---

## Monitoring Queries

### Database Size

```sql
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'your_database';
```

### Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Usage

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Partition Statistics

```sql
SELECT * FROM get_partition_statistics();
SELECT * FROM list_sensor_reading_partitions();
```

### Slow Queries (requires pg_stat_statements)

```sql
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Partition Not Found Error

If you get "partition not found" errors, create the partition:

```sql
SELECT ensure_current_partition();
-- or
SELECT create_next_month_partition();
```

### Materialized View Stale

Refresh the materialized view:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sensor_stats;
```

### High Disk Usage

1. Cleanup old data:
```sql
SELECT cleanup_old_sensor_readings(90);
SELECT cleanup_old_notifications(30);
```

2. Drop old partitions:
```sql
SELECT drop_old_partitions(12);
```

3. Vacuum tables:
```sql
VACUUM ANALYZE sensor_readings;
VACUUM ANALYZE notifications;
```

### Missing System Settings

If system settings are missing:
```sql
INSERT INTO system_settings (id, settings) VALUES (
    'main',
    '{
        "general": {
            "site_name": "Smart Farm Management System",
            "contact_email": "admin@smartfarm.com",
            "maintenance_mode": false
        },
        "notifications": {
            "email_enabled": true,
            "sms_enabled": false
        },
        "security": {
            "session_timeout": 86400,
            "max_login_attempts": 5
        }
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;
```

---

## Migration from Previous Schema

If you have an existing schema (V3.0 or earlier):

### 1. Backup existing data
```bash
pg_dump -U postgres -F c -b -v -f backup.bak your_database
```

### 2. Run migration script

```sql
-- Add new enum types
CREATE TYPE action_status_enum AS ENUM ('queued', 'sent', 'ack', 'error', 'timeout', 'failed');
CREATE TYPE farm_status_enum AS ENUM ('active', 'inactive');

-- Add new columns to farms
ALTER TABLE farms ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS area_hectares DECIMAL(10, 2);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS status farm_status_enum DEFAULT 'active';

-- Create farm_moderators table
CREATE TABLE IF NOT EXISTS farm_moderators (
    farm_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    assigned_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (farm_id, user_id),
    CONSTRAINT fk_farm_moderators_farm FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE CASCADE,
    CONSTRAINT fk_farm_moderators_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (id, settings) VALUES (
    'main',
    '{"general":{"site_name":"Smart Farm Management System","contact_email":"admin@smartfarm.com","maintenance_mode":false},"notifications":{"email_enabled":true,"sms_enabled":false},"security":{"session_timeout":86400,"max_login_attempts":5}}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_farms_status ON farms(status);
CREATE INDEX IF NOT EXISTS idx_farms_city ON farms(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_farms_country ON farms(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_farm_moderators_user ON farm_moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_moderators_farm ON farm_moderators(farm_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_gin ON system_settings USING gin(settings);
```

### 3. Test migration on staging environment

### 4. Apply to production during maintenance window

---

## Support

For issues or questions:
1. Check this README
2. Review schema comments (COMMENT ON statements)
3. Check PostgreSQL logs
4. Review audit_logs table for data change history

---

## Version History

- **v4.0** (2025-12-26): Complete backend entity match with system_settings, farm_moderators, extended farms metadata
- **v3.0** (2025-01-14): Ultimate production schema with all best practices
- **v2.0**: Enhanced schema with materialized views and utility functions
- **v1.0**: Initial backend-compatible schema

---

## License

This schema is part of the Smart Farm IoT backend system.
