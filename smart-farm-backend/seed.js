const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:TpVlakJYjQgqozxkzSrgwdlmpJhMhuZE@roundhouse.proxy.rlwy.net:30880/railway'
});

const runInserts = async () => {
  try {
    await client.connect();
    console.log('Connected to DB');

    // Users
    await client.query(`
      INSERT INTO users (user_id, email, password, first_name, last_name, phone, role, status, city, country)
      VALUES 
          ('user-admin-001', 'admin@smartfarm.com', '$2b$10$examplehashadmin', 'Admin', 'User', '+1234567890', 'admin', 'active', 'San Francisco', 'USA'),
          ('user-farmer-001', 'farmer@smartfarm.com', '$2b$10$examplehashfarmer', 'John', 'Farmer', '+1234567891', 'farmer', 'active', 'Sacramento', 'USA'),
          ('user-moderator-001', 'moderator@smartfarm.com', '$2b$10$examplehashmoderator', 'Jane', 'Moderator', '+1234567892', 'moderator', 'active', 'Los Angeles', 'USA')
      ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted users');

    // Farms
    await client.query(`
      INSERT INTO farms (farm_id, name, location, owner_id)
      VALUES 
          ('farm-001', 'Green Valley Farm', 'Sacramento, CA', 'user-farmer-001'),
          ('farm-002', 'Sunset Orchards', 'Fresno, CA', 'user-farmer-001')
      ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted farms');

    // Crops
    await client.query(`
      INSERT INTO crops (crop_id, farm_id, name, description, variety, planting_date, expected_harvest_date, status)
      VALUES 
          ('crop-tomato-001', 'farm-001', 'Tomatoes', 'Heirloom tomatoes for summer harvest', 'Brandywine', '2025-04-15', '2025-08-20', 'growing'),
          ('crop-lettuce-001', 'farm-001', 'Lettuce', 'Leaf lettuce for spring harvest', 'Buttercrunch', '2025-03-10', '2025-05-15', 'planted')
      ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted crops');

    // Devices
    await client.query(`
      INSERT INTO devices (device_id, name, location, status, farm_id)
      VALUES 
          ('device-dht11-001', 'DHT11 Sensor Hub', 'Greenhouse A', 'online', 'farm-001'),
          ('device-soil-001', 'Soil Moisture Sensor Array', 'Field Section 1', 'online', 'farm-001'),
          ('device-light-001', 'Light Sensor Network', 'Greenhouse B', 'offline', 'farm-001'),
          ('device-actuator-001', 'Actuator Controller', 'Main Control Room', 'online', 'farm-001')
      ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted devices');

    // Sensors - Note: replaced crop_id with zone_id as NULL because actual DB schema has zone_id (UUID)
    await client.query(`
      INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, zone_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high)
      VALUES 
          ('sensor-temp-001', 'farm-001', 'temperature', '°C', 'device-dht11-001', 'Greenhouse A', NULL, 10.00, 15.00, 28.00, 35.00, 'mqtt:smartfarm/actuators/heater_on', 'mqtt:smartfarm/actuators/fan_on'),
          ('sensor-humid-001', 'farm-001', 'humidity', '%', 'device-dht11-001', 'Greenhouse A', NULL, 40.00, 50.00, 70.00, 80.00, 'mqtt:smartfarm/actuators/humidifier_on', 'mqtt:smartfarm/actuators/dehumidifier_on'),
          ('sensor-soil-001', 'farm-001', 'soil_moisture', '%', 'device-soil-001', 'Field Section 1', NULL, 0.20, 0.30, 0.70, 0.80, 'mqtt:smartfarm/actuators/irrigation_on', NULL),
          ('sensor-light-001', 'farm-001', 'light_intensity', 'lux', 'device-light-001', 'Greenhouse B', NULL, 200.00, 500.00, 2000.00, 3000.00, 'mqtt:smartfarm/actuators/lights_on', NULL);
    `);
    console.log('Inserted sensors');

    // Sensor Readings
    await client.query(`
      INSERT INTO sensor_readings (sensor_id, value1, value2, created_at)
      VALUES 
          ('sensor-temp-001', 24.5, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
          ('sensor-temp-001', 25.2, NULL, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
          ('sensor-humid-001', 62.3, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
          ('sensor-soil-001', 0.45, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
          ('sensor-light-001', 1200.0, NULL, CURRENT_TIMESTAMP - INTERVAL '5 minutes');
    `);
    console.log('Inserted sensor_readings');

    // Action Logs
    await client.query(`
      INSERT INTO action_logs (trigger_source, device_id, sensor_id, sensor_type, value, unit, violation_type, action_uri, status, topic)
      VALUES 
          ('auto', 'device-dht11-001', 'sensor-temp-001', 'temperature', 36.5, '°C', 'critical_high', 'mqtt:smartfarm/actuators/fan_on', 'sent', 'smartfarm/actuators/fan_on'),
          ('manual', 'device-actuator-001', NULL, NULL, NULL, NULL, NULL, 'mqtt:smartfarm/actuators/irrigation_on', 'ack', 'smartfarm/actuators/irrigation_on');
    `);
    console.log('Inserted action logs');

    // Notifications
    await client.query(`
      INSERT INTO notifications (user_id, level, source, title, message, is_read)
      VALUES 
          ('user-farmer-001', 'warning', 'sensor', 'High Temperature Alert', 'Temperature in Greenhouse A reached 36.5°C', FALSE),
          ('user-farmer-001', 'info', 'system', 'Irrigation Completed', 'Scheduled irrigation for Field Section 1 completed successfully', TRUE);
    `);
    console.log('Inserted notifications');

    // Sensor Actuator Rules
    await client.query(`
      INSERT INTO sensor_actuator_rules (rule_name, sensor_type, violation_type, actuator_command, priority, description)
      VALUES
          ('default_temp_high_fan', 'temperature', 'critical_high', 'fan_on', 10, 'Turn on fan when any temperature sensor reads critically high'),
          ('default_temp_low_heater', 'temperature', 'critical_low', 'heater_on', 10, 'Turn on heater when any temperature sensor reads critically low'),
          ('default_temp_warning_high', 'temperature', 'warning_high', 'ventilator_on', 10, 'Moderate ventilation for warning-level high temperature'),
          ('default_temp_warning_low', 'temperature', 'warning_low', 'heater_on', 10, 'Gentle heating for warning-level low temperature'),
          ('default_humidity_low', 'humidity', 'critical_low', 'irrigation_on', 10, 'Turn on irrigation when humidity is critically low'),
          ('default_humidity_high', 'humidity', 'critical_high', 'fan_on', 10, 'Turn on fan/dehumidifier when humidity is critically high'),
          ('default_humidity_warning_low', 'humidity', 'warning_low', 'misting_on', 10, 'Gentle misting for warning-level low humidity'),
          ('default_soil_dry', 'soil_moisture', 'critical_low', 'irrigation_on', 10, 'Turn on irrigation when soil is critically dry'),
          ('default_soil_wet', 'soil_moisture', 'critical_high', 'irrigation_off', 10, 'Stop irrigation when soil is too wet'),
          ('default_soil_warning_dry', 'soil_moisture', 'warning_low', 'irrigation_on', 10, 'Start irrigation for warning-level dry soil'),
          ('default_light_low', 'light_intensity', 'critical_low', 'lights_on', 10, 'Turn on grow lights when light is insufficient'),
          ('default_light_high', 'light_intensity', 'critical_high', 'lights_off', 10, 'Turn off lights when natural light is sufficient'),
          ('default_light_warning_low', 'light_intensity', 'warning_low', 'lights_on', 10, 'Turn on lights at warning level for optimal growth'),
          ('greenhouse_a_temp_high', 'temperature', 'critical_high', 'fan_on', 20, 'Use greenhouse A fan for temperature control'),
          ('field_section_1_soil_dry', 'soil_moisture', 'critical_low', 'irrigation_on', 20, 'Use field section 1 irrigation for soil moisture control');
    `);
    console.log('Inserted rules');

  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    await client.end();
  }
};

runInserts();
