import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },

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
