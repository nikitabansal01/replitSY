import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./shared-schema";
import { createConnection } from 'net';
import { lookup } from 'dns';
import { promisify } from 'util';
import { exec } from 'child_process';
import { promisify as utilPromisify } from 'util';

const dnsLookup = promisify(lookup);
const execAsync = utilPromisify(exec);

// Create a fallback database client that doesn't require connection
let db: any = null;
let supabase: any = null;

// Function to resolve hostname to IPv4 only with multiple fallback methods
async function resolveIPv4(hostname: string): Promise<string> {
  try {
    // Method 1: DNS lookup with family 4
    const addresses = await dnsLookup(hostname, { family: 4 });
    console.log(`DNS resolved ${hostname} to IPv4: ${addresses.address}`);
    return addresses.address;
  } catch (error) {
    console.warn(`DNS lookup failed for ${hostname}:`, error);
    
    try {
      // Method 2: Use nslookup command as fallback
      const { stdout } = await execAsync(`nslookup ${hostname} | grep -A1 "Name:" | tail -1 | awk '{print $2}'`);
      const ip = stdout.trim();
      if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        console.log(`nslookup resolved ${hostname} to IPv4: ${ip}`);
        return ip;
      }
    } catch (nslookupError) {
      console.warn(`nslookup failed for ${hostname}:`, nslookupError);
    }
    
    // Method 3: Try dig command
    try {
      const { stdout } = await execAsync(`dig +short ${hostname} A | head -1`);
      const ip = stdout.trim();
      if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        console.log(`dig resolved ${hostname} to IPv4: ${ip}`);
        return ip;
      }
    } catch (digError) {
      console.warn(`dig failed for ${hostname}:`, digError);
    }
    
    console.warn(`All IPv4 resolution methods failed for ${hostname}, using original hostname`);
    return hostname; // Fallback to original hostname
  }
}

// Function to test direct TCP connection to verify reachability
async function testTCPConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection(port, host, () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 5000);
  });
}

async function createDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - using in-memory storage only");
    return null;
  }

  const originalUrl = new URL(process.env.DATABASE_URL);
  console.log('Database URL hostname:', originalUrl.hostname);
  console.log('Database URL port:', originalUrl.port || '5432');

  // First, try to resolve the hostname to IPv4
  let resolvedHost = originalUrl.hostname;
  try {
    resolvedHost = await resolveIPv4(originalUrl.hostname);
    console.log(`Resolved hostname ${originalUrl.hostname} to ${resolvedHost}`);
    
    // Test TCP connectivity to the resolved IP
    const isReachable = await testTCPConnection(resolvedHost, parseInt(originalUrl.port || '5432'));
    console.log(`TCP connectivity test to ${resolvedHost}:${originalUrl.port || '5432'} - ${isReachable ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    console.warn('Failed to resolve hostname or test connectivity:', error);
  }

  // Try multiple connection strategies with aggressive IPv4 forcing
  const connectionStrategies = [
    // Strategy 1: Direct IPv4 connection with resolved IP
    {
      name: 'Direct IPv4 with resolved IP',
      connectionString: `postgresql://${originalUrl.username}:${originalUrl.password}@${resolvedHost}:${originalUrl.port || '5432'}${originalUrl.pathname}?sslmode=require&connection_limit=1`,
      options: { 
        ssl: 'require' as const, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 15,
        connection: {
          family: 4, // Force IPv4
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000
        }
      }
    },
    // Strategy 2: IPv4 connection with prefer SSL
    {
      name: 'IPv4 with prefer SSL',
      connectionString: `postgresql://${originalUrl.username}:${originalUrl.password}@${resolvedHost}:${originalUrl.port || '5432'}${originalUrl.pathname}?sslmode=prefer&connection_limit=1`,
      options: { 
        ssl: 'prefer' as const, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 20,
        connection: {
          family: 4 // Force IPv4
        }
      }
    },
    // Strategy 3: IPv4 connection with allow SSL
    {
      name: 'IPv4 with allow SSL',
      connectionString: `postgresql://${originalUrl.username}:${originalUrl.password}@${resolvedHost}:${originalUrl.port || '5432'}${originalUrl.pathname}?sslmode=allow&connection_limit=1`,
      options: { 
        ssl: 'allow' as const, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 20,
        connection: {
          family: 4 // Force IPv4
        }
      }
    },
    // Strategy 4: IPv4 connection without SSL (for testing)
    {
      name: 'IPv4 without SSL',
      connectionString: `postgresql://${originalUrl.username}:${originalUrl.password}@${resolvedHost}:${originalUrl.port || '5432'}${originalUrl.pathname}?sslmode=disable&connection_limit=1`,
      options: { 
        ssl: false, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 15,
        connection: {
          family: 4 // Force IPv4
        }
      }
    },
    // Strategy 5: Original hostname with IPv4 family forcing
    {
      name: 'Original hostname with IPv4 family',
      connectionString: `postgresql://${originalUrl.username}:${originalUrl.password}@${originalUrl.hostname}:${originalUrl.port || '5432'}${originalUrl.pathname}?sslmode=require&connection_limit=1`,
      options: { 
        ssl: 'require' as const, 
        max: 1, 
        idle_timeout: 30, 
        connect_timeout: 15,
        connection: {
          family: 4, // Force IPv4
          keepAlive: true
        }
      }
    },
    // Strategy 6: Connection with longer timeout and IPv4 family
    {
      name: 'Long timeout with IPv4 family',
      connectionString: `postgresql://${originalUrl.username}:${originalUrl.password}@${resolvedHost}:${originalUrl.port || '5432'}${originalUrl.pathname}?sslmode=require&connection_limit=1&connect_timeout=30`,
      options: { 
        ssl: 'require' as const, 
        max: 1, 
        idle_timeout: 60, 
        connect_timeout: 30,
        connection: {
          family: 4,
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
  } else {
    console.warn('Database connection failed - some features may not work properly');
  }
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  console.error("Connection details:", {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    urlLength: process.env.DATABASE_URL?.length || 0,
    errorMessage: error instanceof Error ? error.message : 'Unknown error'
  });
  
  // Create a fallback database connection that will fail gracefully
  console.warn('Creating fallback database connection that will handle errors gracefully');
  try {
    const fallbackClient = postgres(process.env.DATABASE_URL || '', {
      ssl: 'prefer',
      max: 1,
      idle_timeout: 30,
      connect_timeout: 10,
      connection: {
        family: 4,
        keepAlive: true
      },
      onnotice: () => {}, // Suppress notices
      onparameter: () => {}, // Suppress parameter notices
    });
    
    db = drizzle(fallbackClient, { schema });
    console.log('Fallback database connection created (will handle errors gracefully)');
  } catch (fallbackError) {
    console.error('Even fallback database connection failed:', fallbackError);
    console.warn('Application will run without database functionality');
  }
}

// Supabase is optional - will be null if not configured
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  console.log("Supabase environment variables found - Supabase features will be available at runtime");
} else {
  console.warn("SUPABASE_URL and SUPABASE_ANON_KEY not set - Supabase features disabled");
}

export { db, supabase };