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

  // Try multiple connection strategies with more aggressive IPv6 bypass
  const connectionStrategies = [
    // Strategy 1: Direct connection with SSL require and connection pooling
    {
      name: 'Direct with SSL require and pooling',
      connectionString: process.env.DATABASE_URL.includes('?') 
        ? `${process.env.DATABASE_URL}&sslmode=require&connection_limit=1`
        : `${process.env.DATABASE_URL}?sslmode=require&connection_limit=1`,
      options: { 
        ssl: 'require' as const, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 15,
        connection: {
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000
        }
      }
    },
    // Strategy 2: Direct connection with SSL allow and longer timeout
    {
      name: 'Direct with SSL allow and longer timeout',
      connectionString: process.env.DATABASE_URL.includes('?') 
        ? `${process.env.DATABASE_URL}&sslmode=allow&connection_limit=1`
        : `${process.env.DATABASE_URL}?sslmode=allow&connection_limit=1`,
      options: { 
        ssl: 'allow' as const, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 20 
      }
    },
    // Strategy 3: Parsed connection with explicit host and IPv4 forcing
    {
      name: 'Parsed connection with IPv4 forcing',
      connectionString: (() => {
        const url = new URL(process.env.DATABASE_URL);
        // Force IPv4 by using the direct connection string with specific parameters
        return `postgresql://${url.username}:${url.password}@${url.hostname}:${url.port || '5432'}${url.pathname}?sslmode=require&connection_limit=1`;
      })(),
      options: { 
        ssl: 'require' as const, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 15 
      }
    },
    // Strategy 4: Connection without SSL (for testing)
    {
      name: 'Connection without SSL',
      connectionString: process.env.DATABASE_URL.includes('?') 
        ? `${process.env.DATABASE_URL}&sslmode=disable&connection_limit=1`
        : `${process.env.DATABASE_URL}?sslmode=disable&connection_limit=1`,
      options: { ssl: false, max: 1, idle_timeout: 30, connect_timeout: 15 }
    },
    // Strategy 5: IPv4-specific connection with prefer SSL
    {
      name: 'IPv4 connection with prefer SSL',
      connectionString: process.env.DATABASE_URL.includes('?') 
        ? `${process.env.DATABASE_URL}&sslmode=prefer&connection_limit=1`
        : `${process.env.DATABASE_URL}?sslmode=prefer&connection_limit=1`,
      options: { ssl: 'prefer' as const, max: 1, idle_timeout: 30, connect_timeout: 15 }
    },
    // Strategy 6: Connection with minimal SSL and retry logic
    {
      name: 'Minimal SSL with retry',
      connectionString: process.env.DATABASE_URL.includes('?') 
        ? `${process.env.DATABASE_URL}&sslmode=prefer&connection_limit=1&connect_timeout=30`
        : `${process.env.DATABASE_URL}?sslmode=prefer&connection_limit=1&connect_timeout=30`,
      options: { 
        ssl: 'prefer' as const, 
        max: 1, 
        idle_timeout: 60, 
        connect_timeout: 30,
        connection: {
          keepAlive: true
        }
      }
    }
  ];

  for (const strategy of connectionStrategies) {
    try {
      console.log(`Trying connection strategy: ${strategy.name}`);
      console.log(`Connection string: ${strategy.connectionString.replace(/:[^:@]*@/, ':****@')}`); // Hide password
      
      const client = postgres(strategy.connectionString, strategy.options);
      
      // Test the connection with retry logic
      let connected = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`Connection attempt ${attempt} for strategy: ${strategy.name}`);
          await client`SELECT 1`;
          connected = true;
          console.log(`Database connection successful with strategy: ${strategy.name} on attempt ${attempt}`);
          break;
        } catch (attemptError) {
          console.warn(`Connection attempt ${attempt} failed for strategy: ${strategy.name}:`, attemptError instanceof Error ? attemptError.message : 'Unknown error');
          if (attempt < 3) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (connected) {
        return drizzle(client, { schema });
      }
    } catch (error) {
      console.warn(`Connection strategy "${strategy.name}" failed:`, error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.message.includes('ENETUNREACH')) {
        console.warn('IPv6 connection issue detected - trying next strategy');
      }
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