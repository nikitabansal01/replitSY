import 'dotenv/config';
// or
import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { db } from './db';
import { users } from './shared-schema';

const app = express();

const allowedOrigins = [
  "https://hormoneinsightsrepo.vercel.app",
  "https://hormoneinsights-repo.vercel.app",
  "https://hormoneinsights.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "https://localhost:3000",
  "https://localhost:5173",
  "https://localhost:4173",
  // Add any other preview or custom domains you use
];

// More flexible CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.endsWith('.vercel.app') ||
      origin === 'https://hormoneinsightsrepo.vercel.app' ||
      origin === 'https://hormoneinsights-repo.vercel.app' ||
      origin === 'https://hormoneinsights.vercel.app' ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost')
    ) {
      return callback(null, true);
    }
    console.log(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: false,
        error: null,
        connectionDetails: null
      },
      environment_variables: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasOpenaiApiKey: !!process.env.OPENAI_API_KEY
      }
    };

    try {
      // Test database connection
      if (db) {
        try {
          await db.select().from(users).limit(1);
          health.database.connected = true;
          health.database.connectionDetails = {
            hostname: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'unknown',
            database: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.replace('/', '') : 'unknown'
          };
        } catch (dbError) {
          health.database.error = dbError instanceof Error ? dbError.message : 'Unknown database error';
          health.status = 'degraded';
        }
      } else {
        health.database.error = 'Database not initialized';
        health.status = 'degraded';
      }
    } catch (error) {
      health.database.error = error instanceof Error ? error.message : 'Unknown error';
      health.status = 'error';
    }

    res.json(health);
  });

  // Database connection test endpoint
  app.get('/test-db', async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ 
          error: 'Database not initialized',
          details: 'The database connection was not established during startup'
        });
      }

      // Test basic query
      const result = await db.select().from(users).limit(1);
      
      res.json({
        success: true,
        message: 'Database connection successful',
        result: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database test failed:', error);
      res.status(500).json({
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // CORS debugging endpoint
  app.get('/api/cors-debug', (req, res) => {
    res.json({
      origin: req.headers.origin,
      referer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      allowedOrigins,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Use PORT from environment variable (Railway will provide this)
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0" // Listen on all interfaces for Railway
  }, () => {
    console.log(`API server running on port ${port}`);
  });
})();
