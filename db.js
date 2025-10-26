const { Pool } = require("pg");

console.log(`🔄 Initializing database connection...`);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log(`🔄 Setting up database...`);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      INSERT INTO settings (key, value) 
      VALUES ('app_version', '1.0.0') 
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log(`✅ Database ready! Tables: settings, contacts`);
  } catch (err) {
    console.error(`❌ Database setup failed: ${err.message}`);
    process.exit(1);
  } finally {
    client.release();
  }
})();

module.exports = pool;