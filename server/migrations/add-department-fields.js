import sequelize from '../config/database.js';

const addDepartmentFields = async () => {
  try {
    // Check if departmentId column exists in users table
    const usersTableInfo = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'departmentId'
    `);
    
    if (usersTableInfo[0].length === 0) {
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN "departmentId" INTEGER REFERENCES departments(id)
      `);
      console.log('✅ Added departmentId to users table');
    } else {
      console.log('ℹ️  departmentId already exists in users table');
    }
    
    // Check if departmentId column exists in classes table
    const classesTableInfo = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'classes' AND column_name = 'departmentId'
    `);
    
    if (classesTableInfo[0].length === 0) {
      await sequelize.query(`
        ALTER TABLE classes ADD COLUMN "departmentId" INTEGER REFERENCES departments(id)
      `);
      console.log('✅ Added departmentId to classes table');
    } else {
      console.log('ℹ️  departmentId already exists in classes table');
    }
    
    // Update existing classes to have a default department
    const defaultDept = await sequelize.query(`
      SELECT id FROM departments LIMIT 1
    `);
    
    if (defaultDept[0].length > 0) {
      await sequelize.query(`
        UPDATE classes SET "departmentId" = ${defaultDept[0][0].id} WHERE "departmentId" IS NULL
      `);
      console.log('✅ Updated existing classes with default department');
    }
    
    // Update existing users to have a default department
    if (defaultDept[0].length > 0) {
      await sequelize.query(`
        UPDATE users SET "departmentId" = ${defaultDept[0][0].id} WHERE "departmentId" IS NULL AND role IN ('STUDENT', 'STAFF')
      `);
      console.log('✅ Updated existing users with default department');
    }
    
    console.log('✅ Department fields setup completed successfully');
  } catch (error) {
    console.error('❌ Error adding department fields:', error);
    throw error;
  }
};

export default addDepartmentFields;
