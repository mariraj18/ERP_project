import sequelize from '../config/database.js';

const createDepartmentsTable = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        "headId" INTEGER,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("headId") REFERENCES users(id)
      )
    `);
    
    console.log('✅ Departments table created successfully');
  } catch (error) {
    console.error('❌ Error creating departments table:', error);
    throw error;
  }
};

export default createDepartmentsTable;
