const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:TpVlakJYjQgqozxkzSrgwdlmpJhMhuZE@roundhouse.proxy.rlwy.net:30880/railway'
});

const sql = `
INSERT INTO sensors (sensor_id, farm_id, type, unit, device_id, location, zone_id, min_critical, min_warning, max_warning, max_critical, action_low, action_high)
VALUES 
    ('sensor-temp-001', 'farm-001', 'temperature', '°C', 'device-dht11-001', 'Greenhouse A', NULL, 10.00, 15.00, 28.00, 35.00, 'mqtt:smartfarm/actuators/heater_on', 'mqtt:smartfarm/actuators/fan_on'),
    ('sensor-humid-001', 'farm-001', 'humidity', '%', 'device-dht11-001', 'Greenhouse A', NULL, 40.00, 50.00, 70.00, 80.00, 'mqtt:smartfarm/actuators/humidifier_on', 'mqtt:smartfarm/actuators/dehumidifier_on'),
    ('sensor-soil-001', 'farm-001', 'soil_moisture', '%', 'device-soil-001', 'Field Section 1', NULL, 0.20, 0.30, 0.70, 0.80, 'mqtt:smartfarm/actuators/irrigation_on', NULL),
    ('sensor-light-001', 'farm-001', 'light_intensity', 'lux', 'device-light-001', 'Greenhouse B', NULL, 200.00, 500.00, 2000.00, 3000.00, 'mqtt:smartfarm/actuators/lights_on', NULL);
`;

client.connect()
  .then(async () => {
    try {
      const res = await client.query(sql);
      console.log('Successfully inserted sensors!', res.rowCount);
    } catch (e) {
      console.error('Insert failed:', e.message);
    }
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
