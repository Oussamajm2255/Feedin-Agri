-- ============================================
-- ADMIN NOTIFICATIONS SAMPLE DATA
-- For UI Testing and Development
-- ============================================
-- Run this after create-admin-notifications.sql
-- This creates a variety of notifications across all severities, domains, and statuses

-- Clear existing sample data (optional - comment out if you want to keep existing)
-- DELETE FROM admin_notifications WHERE type LIKE '%_test' OR created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- 🔴 CRITICAL ALERTS (Pinned until resolved)
-- ============================================

-- Active critical - MQTT disconnected (NEW - unresolved)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'mqtt_disconnect',
    'critical',
    'system',
    'MQTT Broker Disconnected',
    'Connection to MQTT broker lost at mqtt.smartfarm.io:1883. IoT devices may not receive commands. Last successful ping was 5 minutes ago.',
    '{
        "broker": "mqtt.smartfarm.io:1883",
        "error": "Connection timeout after 30000ms",
        "lastPing": "2026-02-06T20:30:00Z",
        "suggestedActions": [
            "Check MQTT broker status on cloud dashboard",
            "Verify network connectivity to broker",
            "Review broker logs for authentication errors",
            "Restart MQTT service if needed"
        ]
    }'::jsonb,
    'new',
    true,
    NOW() - INTERVAL '15 minutes'
);

-- Active critical - Database unhealthy (ACKNOWLEDGED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, acknowledged_at, acknowledged_by)
VALUES (
    gen_random_uuid(),
    'database_unhealthy',
    'critical',
    'system',
    'Database Connection Pool Exhausted',
    'PostgreSQL connection pool reached maximum capacity (100/100). New queries may fail or timeout. High traffic detected from sensor data ingestion.',
    '{
        "poolSize": 100,
        "activeConnections": 100,
        "pendingRequests": 47,
        "avgQueryTime": "2.3s",
        "suggestedActions": [
            "Increase connection pool size in config",
            "Investigate slow queries",
            "Enable query caching",
            "Scale database resources"
        ]
    }'::jsonb,
    'acknowledged',
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes',
    'admin-user-id-123'
);

-- Resolved critical - Previous MQTT issue
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, acknowledged_at, resolved_at, resolved_by)
VALUES (
    gen_random_uuid(),
    'mqtt_disconnect',
    'critical',
    'system',
    'MQTT Broker Disconnected',
    'Connection to MQTT broker lost. Automatic reconnection failed after 3 attempts.',
    '{
        "broker": "mqtt.smartfarm.io:1883",
        "error": "ECONNREFUSED",
        "reconnectAttempts": 3,
        "suggestedActions": ["Check broker status", "Verify credentials"]
    }'::jsonb,
    'resolved',
    false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '10 minutes',
    NOW() - INTERVAL '3 days' + INTERVAL '45 minutes',
    'admin-user-id-456'
);

-- ============================================
-- 🟠 WARNINGS
-- ============================================

-- Device offline spike (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'device_offline_spike',
    'warning',
    'devices',
    'Device Offline Spike Detected',
    '12 devices went offline simultaneously at Ferme Oasis (threshold: 5). Possible network or power issue affecting Zone A.',
    '{
        "farmId": "farm-uuid-001",
        "farmName": "Ferme Oasis",
        "offlineCount": 12,
        "threshold": 5,
        "affectedZone": "Zone A",
        "deviceTypes": ["moisture_sensor", "temperature_sensor", "irrigation_controller"],
        "suggestedActions": [
            "Check farm network connectivity",
            "Verify power supply to Zone A devices",
            "Contact farm operator: +216 71 123 456"
        ]
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '45 minutes'
);

-- Sensor reading delay (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'sensor_reading_delay',
    'warning',
    'devices',
    'Sensor Reading Delayed',
    'Soil moisture sensor SM-2024-0156 has not reported data for 6 hours. Expected interval: 15 minutes.',
    '{
        "sensorId": "sensor-uuid-156",
        "sensorName": "SM-2024-0156",
        "deviceId": "device-uuid-089",
        "deviceName": "Moisture Hub Zone B",
        "farmId": "farm-uuid-002",
        "farmName": "Domaine Vert",
        "lastReading": "2026-02-06T14:30:00Z",
        "expectedInterval": "15 minutes",
        "suggestedActions": [
            "Check sensor battery level",
            "Verify wireless connectivity",
            "Inspect sensor physical condition"
        ]
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '30 minutes'
);

-- Subscription expired (ACKNOWLEDGED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, acknowledged_at)
VALUES (
    gen_random_uuid(),
    'subscription_expired',
    'warning',
    'users',
    'Subscription Expired',
    'Ahmed Ben Salah''s Premium subscription expired 3 days ago. Farm access restricted to basic features.',
    '{
        "userId": "user-uuid-789",
        "userName": "Ahmed Ben Salah",
        "email": "ahmed.bensalah@email.tn",
        "plan": "Premium",
        "expirationDate": "2026-02-03T23:59:59Z",
        "farmCount": 2,
        "suggestedActions": [
            "Send renewal reminder email",
            "Offer discount for immediate renewal",
            "Schedule follow-up call"
        ]
    }'::jsonb,
    'acknowledged',
    false,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days 20 hours'
);

-- Action execution failed (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'action_execution_failed',
    'warning',
    'automation',
    'Irrigation Action Failed',
    'Failed to execute irrigation ON command on Valve Controller VC-003. Error: Device not responding.',
    '{
        "actionId": "action-uuid-445",
        "deviceId": "device-uuid-vc003",
        "deviceName": "Valve Controller VC-003",
        "farmId": "farm-uuid-001",
        "farmName": "Ferme Oasis",
        "command": "irrigation_on",
        "duration": "30 minutes",
        "error": "MQTT_TIMEOUT: Device did not acknowledge command within 60s",
        "retryCount": 3,
        "suggestedActions": [
            "Check device connectivity status",
            "Verify actuator hardware",
            "Manual override may be required",
            "Contact field technician"
        ]
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '1 hour 20 minutes'
);

-- High frequency actions (RESOLVED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, resolved_at, resolved_by)
VALUES (
    gen_random_uuid(),
    'action_high_frequency',
    'warning',
    'automation',
    'High-Frequency Actions Detected',
    'Pump Controller P-007 received 47 toggle commands in 30 minutes. Possible oscillation issue due to sensor threshold configuration.',
    '{
        "deviceId": "device-uuid-p007",
        "deviceName": "Pump Controller P-007",
        "farmId": "farm-uuid-003",
        "farmName": "Exploitation Agricole Sfax",
        "actionCount": 47,
        "timeWindowMinutes": 30,
        "triggerSensor": "soil_moisture_zone_c",
        "suggestedActions": [
            "Increase hysteresis threshold from 5% to 15%",
            "Add 5-minute cooldown between actions",
            "Review sensor calibration"
        ]
    }'::jsonb,
    'resolved',
    false,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day 22 hours',
    'admin-user-id-123'
);

-- Service degraded (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'service_degraded',
    'warning',
    'system',
    'Weather Service Degraded',
    'External weather API responding slowly. Average response time increased from 200ms to 3.5s. Weather-based automations may be delayed.',
    '{
        "service": "OpenWeatherMap API",
        "avgResponseTime": "3500ms",
        "normalResponseTime": "200ms",
        "errorRate": "12%",
        "affectedFeatures": ["weather_based_irrigation", "frost_alerts", "rain_detection"]
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '2 hours'
);

-- ============================================
-- 🔵 INFORMATIONAL
-- ============================================

-- New user registered (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'user_registered',
    'info',
    'users',
    'New User Registered',
    'Fatma Trabelsi (fatma.trabelsi@gmail.com) registered as Farmer. Awaiting farm assignment.',
    '{
        "userId": "user-uuid-new-001",
        "userName": "Fatma Trabelsi",
        "email": "fatma.trabelsi@gmail.com",
        "role": "farmer",
        "registrationSource": "web",
        "phone": "+216 98 765 432",
        "location": "Nabeul, Tunisia"
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '25 minutes'
);

-- New user registered (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'user_registered',
    'info',
    'users',
    'New User Registered',
    'Mohamed Khelifi (m.khelifi@agroinvest.tn) registered as Farmer from mobile app.',
    '{
        "userId": "user-uuid-new-002",
        "userName": "Mohamed Khelifi",
        "email": "m.khelifi@agroinvest.tn",
        "role": "farmer",
        "registrationSource": "mobile_app",
        "company": "AgroInvest Tunisia"
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '3 hours'
);

-- Farm access request (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'user_farm_request',
    'info',
    'users',
    'Farm Access Request',
    'Sami Bouaziz (sami.b@outlook.com) requested farm access. User has been a member for 2 days with no assigned farm.',
    '{
        "userId": "user-uuid-sami",
        "userName": "Sami Bouaziz",
        "email": "sami.b@outlook.com",
        "memberSince": "2026-02-04",
        "requestedAt": "2026-02-06T19:45:00Z",
        "suggestedActions": [
            "Review user profile",
            "Assign existing farm or create new one",
            "Contact user for farm details"
        ]
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '1 hour 50 minutes'
);

-- New farm created (ACKNOWLEDGED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, acknowledged_at)
VALUES (
    gen_random_uuid(),
    'farm_created',
    'info',
    'farms',
    'New Farm Created',
    'Farm "Les Jardins de Carthage" created by Youssef Mansour. Location: Ariana, 15 hectares, focusing on organic vegetables.',
    '{
        "farmId": "farm-uuid-new-001",
        "farmName": "Les Jardins de Carthage",
        "userId": "user-uuid-youssef",
        "ownerEmail": "youssef.mansour@email.tn",
        "location": {
            "city": "Ariana",
            "region": "Grand Tunis",
            "coordinates": {"lat": 36.862499, "lng": 10.195556}
        },
        "size": "15 hectares",
        "cropTypes": ["tomatoes", "peppers", "cucumbers", "lettuce"],
        "farmingType": "organic"
    }'::jsonb,
    'acknowledged',
    false,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '5 hours'
);

-- User inactive (ACKNOWLEDGED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, acknowledged_at)
VALUES (
    gen_random_uuid(),
    'user_inactive',
    'info',
    'users',
    'User Inactive for 30 Days',
    'Karim Gharbi has not logged in for 30 days. Last activity: viewed dashboard on January 7th.',
    '{
        "userId": "user-uuid-karim",
        "userName": "Karim Gharbi",
        "email": "karim.gharbi@ferme.tn",
        "inactiveDays": 30,
        "lastLogin": "2026-01-07T14:22:00Z",
        "lastActivity": "Dashboard view",
        "farmCount": 1,
        "subscriptionStatus": "active"
    }'::jsonb,
    'acknowledged',
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '20 hours'
);

-- Orphan entities detected (RESOLVED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, resolved_at)
VALUES (
    gen_random_uuid(),
    'orphan_device',
    'info',
    'devices',
    'Orphan Devices Detected',
    '3 devices registered but have no sensors attached. These may be incomplete setups.',
    '{
        "entityType": "device",
        "count": 3,
        "farmId": "farm-uuid-002",
        "farmName": "Domaine Vert",
        "deviceIds": ["device-001", "device-002", "device-003"]
    }'::jsonb,
    'resolved',
    false,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days 18 hours'
);

-- Manual override (RESOLVED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, resolved_at)
VALUES (
    gen_random_uuid(),
    'automation_manual_override',
    'info',
    'automation',
    'Manual Override Detected',
    'User manually triggered emergency irrigation OFF on Greenhouse Controller GH-01. Automation was expecting ON based on schedule.',
    '{
        "userId": "user-uuid-789",
        "userName": "Ahmed Ben Salah",
        "deviceId": "device-uuid-gh01",
        "deviceName": "Greenhouse Controller GH-01",
        "farmId": "farm-uuid-001",
        "farmName": "Ferme Oasis",
        "action": "emergency_irrigation_off",
        "previousState": "irrigation_on",
        "automationRule": "scheduled_irrigation_morning"
    }'::jsonb,
    'resolved',
    false,
    NOW() - INTERVAL '1 day 4 hours',
    NOW() - INTERVAL '1 day 2 hours'
);

-- Automation rule disabled (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'automation_disabled',
    'info',
    'automation',
    'Automation Rule Disabled',
    'Rule "Night Frost Protection" was disabled by farm owner. This rule triggered heating when temperature dropped below 4°C.',
    '{
        "userId": "user-uuid-youssef",
        "userName": "Youssef Mansour",
        "ruleId": "rule-uuid-frost",
        "ruleName": "Night Frost Protection",
        "farmId": "farm-uuid-new-001",
        "farmName": "Les Jardins de Carthage",
        "ruleCondition": "temperature < 4°C",
        "ruleAction": "activate_greenhouse_heating"
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '4 hours'
);

-- ============================================
-- 🟢 SUCCESS NOTIFICATIONS
-- ============================================

-- MQTT reconnected (RESOLVED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, resolved_at)
VALUES (
    gen_random_uuid(),
    'mqtt_reconnect',
    'success',
    'system',
    'MQTT Broker Reconnected',
    'Connection to MQTT broker restored after 45-minute outage. All 156 devices are now receiving commands.',
    '{
        "broker": "mqtt.smartfarm.io:1883",
        "downtime": "45 minutes",
        "devicesReconnected": 156,
        "reconnectedAt": "2026-02-05T15:30:00Z"
    }'::jsonb,
    'resolved',
    false,
    NOW() - INTERVAL '1 day 6 hours',
    NOW() - INTERVAL '1 day 5 hours'
);

-- Weekly summary (NEW)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at)
VALUES (
    gen_random_uuid(),
    'weekly_summary',
    'success',
    'system',
    'Weekly Platform Summary',
    'Week of Jan 27 - Feb 2: 8 new users, 3 new farms, 2.4M sensor readings processed, 12,450 automation actions executed.',
    '{
        "weekStart": "2026-01-27",
        "weekEnd": "2026-02-02",
        "newUsers": 8,
        "newFarms": 3,
        "sensorReadings": 2400000,
        "actionsExecuted": 12450,
        "activeUsers": 142,
        "uptimePercentage": 99.7,
        "suggestedActions": [
            "Review growth trends in analytics",
            "Plan capacity if sensor data continues to grow",
            "Celebrate team achievements! 🎉"
        ]
    }'::jsonb,
    'new',
    false,
    NOW() - INTERVAL '4 days'
);

-- Previous weekly summary (ACKNOWLEDGED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, acknowledged_at)
VALUES (
    gen_random_uuid(),
    'weekly_summary',
    'success',
    'system',
    'Weekly Platform Summary',
    'Week of Jan 20 - Jan 26: 5 new users, 2 new farms, 1.9M sensor readings processed, 9,800 automation actions executed.',
    '{
        "weekStart": "2026-01-20",
        "weekEnd": "2026-01-26",
        "newUsers": 5,
        "newFarms": 2,
        "sensorReadings": 1900000,
        "actionsExecuted": 9800,
        "activeUsers": 138,
        "uptimePercentage": 99.9
    }'::jsonb,
    'acknowledged',
    false,
    NOW() - INTERVAL '11 days',
    NOW() - INTERVAL '10 days'
);

-- Database optimization complete (RESOLVED)
INSERT INTO admin_notifications (id, type, severity, domain, title, message, context, status, pinned_until_resolved, created_at, resolved_at)
VALUES (
    gen_random_uuid(),
    'maintenance_complete',
    'success',
    'system',
    'Database Optimization Complete',
    'Scheduled database maintenance completed successfully. Query performance improved by 35% after index optimization and vacuum.',
    '{
        "maintenanceType": "vacuum_analyze",
        "duration": "23 minutes",
        "tablesOptimized": 47,
        "indexesRebuilt": 12,
        "performanceImprovement": "35%",
        "nextScheduled": "2026-02-13T03:00:00Z"
    }'::jsonb,
    'resolved',
    false,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days' + INTERVAL '30 minutes'
);

-- ============================================
-- SUMMARY QUERY (optional - to verify data)
-- ============================================
-- SELECT severity, status, COUNT(*) as count 
-- FROM admin_notifications 
-- GROUP BY severity, status 
-- ORDER BY severity, status;

