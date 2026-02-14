import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'college_attendance',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  dialect: 'postgres',
  
  // Safe logging configuration
  logging: process.env.NODE_ENV === 'development' ? 
    (msg) => {
      // Only log important messages, not every SQL query
      if (msg.includes('ERROR') || msg.includes('Executing') && msg.includes('SELECT 1+1')) {
        console.log(msg);
      }
    } 
    : false,
  
  // Connection settings
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  
  // Additional safety settings
  retry: {
    max: 3, // Retry failed queries up to 3 times
  },
  define: {
    timestamps: true, // Ensure createdAt/updatedAt
    underscored: false, // Use camelCase
    freezeTableName: true // Don't pluralize table names
  }
});

export default sequelize;