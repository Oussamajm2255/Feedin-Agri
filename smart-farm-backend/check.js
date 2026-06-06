const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:TpVlakJYjQgqozxkzSrgwdlmpJhMhuZE@roundhouse.proxy.rlwy.net:30880/railway'
});

client.connect()
  .then(async () => {
    console.log('Successfully connected!');
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', res.rows.map(r => r.table_name));
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
