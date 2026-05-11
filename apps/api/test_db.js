const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:Saighodke%40123@db.amqolglefaoonjxbkasu.supabase.co:5432/postgres"
});

client.connect()
  .then(() => {
    console.log('Connected successfully');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Result:', res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    process.exit(1);
  });
