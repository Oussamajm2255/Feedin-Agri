const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:TpVlakJYjQgqozxkzSrgwdlmpJhMhuZE@roundhouse.proxy.rlwy.net:30880/railway'
});

client.connect()
  .then(async () => {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sensors'");
    console.log(res.rows);
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
