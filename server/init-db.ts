import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set in .env.');
    console.log('👉 To connect ReworkGuard directly to your Supabase PostgreSQL database:');
    console.log('   1. Go to Supabase Dashboard -> Project jfeveaptdeqniyriwcbc');
    console.log('   2. Click "Connect" (top right) -> "Connection String" -> "URI"');
    console.log('   3. Copy the URI and set it in your local .env file:');
    console.log('      DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.jfeveaptdeqniyriwcbc.supabase.co:5432/postgres?sslmode=require"');
    console.log('   4. Re-run: npm run db:init\n');
    process.exit(1);
  }

  console.log('🔄 Connecting to PostgreSQL / Supabase database...');
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({ 
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    let schemaPath = path.resolve(__dirname, '../supabase/reworkguard_setup.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(__dirname, 'schema.sql');
    }
    console.log(`📄 Applying setup script from: ${path.basename(schemaPath)}...`);
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('✅ PostgreSQL Schema and all application seed data successfully applied to Supabase!');
  } catch (err: any) {
    console.error('❌ Failed to initialize PostgreSQL database:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
