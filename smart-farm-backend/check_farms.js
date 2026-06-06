const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:TpVlakJYjQgqozxkzSrgwdlmpJhMhuZE@roundhouse.proxy.rlwy.net:30880/railway'
});

client.connect()
  .then(async () => {
    try {
      const res = await client.query("SELECT id, name FROM farms LIMIT 5");
      console.log('Farms:', res.rows);
    } catch (e) {
      console.error('Query failed:', e.message);
    }
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
