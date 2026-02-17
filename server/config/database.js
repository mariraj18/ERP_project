import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import dns from 'dns';

// Force prioritize IPv4 over IPv6 to fix connectivity issues on platforms like Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL is not defined in environment variables.');
  console.error('💡 Please check your Render/Local environment settings.');
} else {
  console.log(`🔌 Database connection string detected (starts with: ${dbUrl.substring(0, 10)}...)`);
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',

  dialectOptions:
    process.env.NODE_ENV === "production"
      ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
      : {},

  logging: process.env.NODE_ENV === 'development'
    ? (msg) => {
      if (
        msg.includes('ERROR') ||
        (msg.includes('Executing') && msg.includes('SELECT 1+1'))
      ) {
        console.log(msg);
      }
    }
    : false,

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  retry: {
    max: 3,
  },

  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});


export default sequelize;
