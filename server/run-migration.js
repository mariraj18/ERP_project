import sequelize from './config/database.js';
import { up as staffClassesUp } from './migrations/20241206-create-staff-classes.js';

async function runMigration() {
  try {
    // Run staff classes migration
    console.log('Running staff classes migration...');
    try {
      await staffClassesUp(sequelize.getQueryInterface(), sequelize);
      console.log('Staff classes migration completed!');
    } catch (error) {
      if (error.message && (error.message.includes('already exists') || error.message.includes('relation') && error.message.includes('already exists'))) {
        console.log('Staff classes migration already applied, skipping...');
      } else {
        throw error;
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
