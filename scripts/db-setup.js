import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

async function setupDatabase() {
  console.log('🔄 Setting up database...');
  
  try {
    // Run the database migration
    console.log('🔄 Running database migrations...');
    await execAsync('npm run db:push');
    
    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();