import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./shared-schema";

// Create a fallback database client that doesn't require connection
let db: any = null;
let supabase: any = null;

async function createDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - using in-memory storage only");
    return null;
  }

  console.log('Database URL hostname:', new URL(process.env.DATABASE_URL).hostname);

  // Try multiple connection strategies
  const connectionStrategies = [
    // Strategy 1: Direct connection with SSL require
    {
      name: 'Direct with SSL require',
      connectionString: process.env.DATABASE_URL.includes('?') 
        ? `${process.env.DATABASE_URL}&sslmode=require`
        : `${process.env.DATABASE_URL}?sslmode=require`,
      options: { ssl: 'require' as const, max: 1, idle_timeout: 20, connect_timeout: 10 }
    },
    // Strategy 2: Direct connection with SSL allow
    {
      name: 'Direct with SSL allow',
      connectionString: process.env.DATABASE_URL.includes('?') 
        ? `${process.env.DATABASE_URL}&sslmode=allow`
        : `${process.env.DATABASE_URL}?sslmode=allow`,
      options: { ssl: 'allow' as const, max: 1, idle_timeout: 20, connect_timeout: 10 }
    },
    // Strategy 3: Parsed connection with explicit host
    {
      name: 'Parsed connection',
      connectionString: (() => {
        const url = new URL(process.env.DATABASE_URL);
        return `postgresql://${url.username}:${url.password}@${url.hostname}:${url.port || '5432'}${url.pathname}?sslmode=require`;
      })(),
      options: { ssl: 'require' as const, max: 1, idle_timeout: 20, connect_timeout: 10 }
    }
  ];

  for (const strategy of connectionStrategies) {
    try {
      console.log(`Trying connection strategy: ${strategy.name}`);
      console.log(`Connection string: ${strategy.connectionString.replace(/:[^:@]*@/, ':****@')}`); // Hide password
      const client = postgres(strategy.connectionString, strategy.options);
      
      // Test the connection
      await client`SELECT 1`;
      console.log(`Database connection successful with strategy: ${strategy.name}`);
      
      return drizzle(client, { schema });
    } catch (error) {
      console.warn(`Connection strategy "${strategy.name}" failed:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }

  throw new Error('All database connection strategies failed');
}

try {
  db = await createDatabaseConnection();
  if (db) {
    console.log('Database connection initialized successfully');
  }
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  console.error("Connection details:", {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    urlLength: process.env.DATABASE_URL?.length || 0,
    errorMessage: error instanceof Error ? error.message : 'Unknown error'
  });
}

// Supabase is optional - will be null if not configured
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  console.log("Supabase environment variables found - Supabase features will be available at runtime");
} else {
  console.warn("SUPABASE_URL and SUPABASE_ANON_KEY not set - Supabase features disabled");
}

export { db, supabase };