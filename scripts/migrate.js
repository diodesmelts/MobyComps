import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = util.promisify(exec);

async function runMigration() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Create migrations directory if it doesn't exist
    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 Creating migrations directory...');
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Run Drizzle migrations
    console.log('🔄 Running Drizzle migrations...');
    await execAsync('npm run db:push');
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

runMigration();