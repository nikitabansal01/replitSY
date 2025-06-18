import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Create a fallback database client that doesn't require connection
let db: any = null;
let supabase: any = null;

try {
  if (process.env.DATABASE_URL) {
    // Create a PostgreSQL client using the direct connection string
    const client = postgres(process.env.DATABASE_URL);
    // Create Drizzle ORM instance
    db = drizzle(client, { schema });
  } else {
    console.warn("DATABASE_URL not set - using in-memory storage only");
  }
} catch (error) {
  console.warn("Failed to initialize database connection:", error);
}

// Supabase is optional - will be null if not configured
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  console.log("Supabase environment variables found - Supabase features will be available at runtime");
} else {
  console.warn("SUPABASE_URL and SUPABASE_ANON_KEY not set - Supabase features disabled");
}

export { db, supabase };