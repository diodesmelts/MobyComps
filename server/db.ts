import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection options - enable SSL in production
const connectionOptions: any = { 
  connectionString: process.env.DATABASE_URL 
};

// In production, ensure we use SSL
if (process.env.NODE_ENV === 'production') {
  // Some providers like Render will set DATABASE_URL with sslmode=require already
  // Check if it's not already set
  if (!process.env.DATABASE_URL.includes('sslmode=require')) {
    console.log('Adding SSL mode to database connection for production');
    // Append sslmode=require if not already present
    connectionOptions.ssl = true;
  }
}

export const pool = new Pool(connectionOptions);
export const db = drizzle({ client: pool, schema });