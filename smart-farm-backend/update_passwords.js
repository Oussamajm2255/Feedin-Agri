const { Client } = require('pg');
const bcrypt = require('bcrypt'); // or bcryptjs depending on what's installed

const client = new Client({
  connectionString: 'postgresql://postgres:TpVlakJYjQgqozxkzSrgwdlmpJhMhuZE@roundhouse.proxy.rlwy.net:30880/railway'
});

const run = async () => {
  try {
    await client.connect();
    
    // Hash 'password123'
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    
    await client.query(`UPDATE users SET password = $1`, [hash]);
    
    console.log('Successfully updated all users to use password: password123');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
};

run();
