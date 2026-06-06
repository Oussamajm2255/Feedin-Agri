const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:TpVlakJYjQgqozxkzSrgwdlmpJhMhuZE@roundhouse.proxy.rlwy.net:30880/railway'
});

client.connect()
  .then(async () => {
    const resCount = await client.query("SELECT COUNT(*) FROM sensors");
    console.log(`Total rows in sensors table: ${resCount.rows[0].count}`);
    
    if (parseInt(resCount.rows[0].count) > 0) {
      const resData = await client.query("SELECT * FROM sensors LIMIT 3");
      console.log('Sample data (first 3 rows):');
      console.log(resData.rows);
    }
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
