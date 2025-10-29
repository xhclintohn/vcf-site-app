// db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const { Pool } = pkg;

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Heroku & AWS RDS SSL
  },
});

// Simple test to verify connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL database successfully!");
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
})();

export default pool;