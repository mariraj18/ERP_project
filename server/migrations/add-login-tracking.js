import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  try {
    console.log('🔄 Running login tracking migration...');
    
    // Check if login_logs table exists
    const tables = await queryInterface.showAllTables();
    const loginLogsExists = tables.some(table => table.toLowerCase() === 'login_logs');
    
    if (!loginLogsExists) {
      // Create login_logs table
      await queryInterface.createTable('login_logs', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        loginTime: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        ipAddress: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        success: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        failureReason: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      });

      // Add indexes for better performance
      await queryInterface.addIndex('login_logs', ['userId']);
      await queryInterface.addIndex('login_logs', ['loginTime']);
      await queryInterface.addIndex('login_logs', ['success']);
      
      console.log('✅ Created login_logs table');
    } else {
      console.log('⚠️ login_logs table already exists');
    }

    // Add login tracking fields to users table
    const userTableInfo = await queryInterface.describeTable('users');
    
    if (!userTableInfo.lastLogin) {
      await queryInterface.addColumn('users', 'lastLogin', {
        type: DataTypes.DATE,
        allowNull: true
      });
      console.log('✅ Added lastLogin column to users table');
    } else {
      console.log('⚠️ lastLogin column already exists');
    }

    if (!userTableInfo.loginCount) {
      await queryInterface.addColumn('users', 'loginCount', {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true
      });
      console.log('✅ Added loginCount column to users table');
    } else {
      console.log('⚠️ loginCount column already exists');
    }

    console.log('✅ Login tracking migration completed successfully');
  } catch (error) {
    console.error('❌ Login tracking migration failed:', error);
  }
};

export const down = async (queryInterface) => {
  try {
    // Remove indexes
    try {
      await queryInterface.removeIndex('login_logs', ['userId']);
      await queryInterface.removeIndex('login_logs', ['loginTime']);
      await queryInterface.removeIndex('login_logs', ['success']);
    } catch (error) {
      console.log('⚠️ Index removal may have failed:', error.message);
    }

    // Drop login_logs table
    try {
      await queryInterface.dropTable('login_logs');
    } catch (error) {
      console.log('⚠️ Table drop may have failed:', error.message);
    }

    // Remove columns from users table
    const userTableInfo = await queryInterface.describeTable('users');
    
    if (userTableInfo.lastLogin) {
      await queryInterface.removeColumn('users', 'lastLogin');
    }
    
    if (userTableInfo.loginCount) {
      await queryInterface.removeColumn('users', 'loginCount');
    }

    console.log('✅ Login tracking migration rollback completed successfully');
  } catch (error) {
    console.error('❌ Login tracking migration rollback failed:', error);
  }
};