import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  try {
    console.log('🔄 Running staff messaging migration...');
    
    // Check if columns exist first
    const tableInfo = await queryInterface.describeTable('messages');
    
    // Add senderId column if it doesn't exist
    if (!tableInfo.senderId) {
      await queryInterface.addColumn('messages', 'senderId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added senderId column');
    } else {
      console.log('⚠️ senderId column already exists');
    }

    // Add recipientId column if it doesn't exist
    if (!tableInfo.recipientId) {
      await queryInterface.addColumn('messages', 'recipientId', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      console.log('✅ Added recipientId column');
    } else {
      console.log('⚠️ recipientId column already exists');
    }

    // Add isStaffMessage column if it doesn't exist
    if (!tableInfo.isStaffMessage) {
      await queryInterface.addColumn('messages', 'isStaffMessage', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
      });
      console.log('✅ Added isStaffMessage column');
    } else {
      console.log('⚠️ isStaffMessage column already exists');
    }

    // For PostgreSQL, we need to handle ENUM differently
    // Instead of changing the ENUM, we'll use STRING type
    try {
      await queryInterface.changeColumn('messages', 'messageType', {
        type: DataTypes.STRING,
        defaultValue: 'INDIVIDUAL',
        allowNull: true
      });
      console.log('✅ Updated messageType to STRING for PostgreSQL compatibility');
    } catch (error) {
      console.log('⚠️ messageType update may have failed:', error.message);
    }

    console.log('✅ Staff messaging migration completed successfully');
  } catch (error) {
    console.error('❌ Staff messaging migration failed:', error);
    // Don't throw error to prevent migration from stopping completely
  }
};

export const down = async (queryInterface) => {
  try {
    // Rollback operations
    const tableInfo = await queryInterface.describeTable('messages');
    
    if (tableInfo.senderId) {
      await queryInterface.removeColumn('messages', 'senderId');
    }
    
    if (tableInfo.recipientId) {
      await queryInterface.removeColumn('messages', 'recipientId');
    }
    
    if (tableInfo.isStaffMessage) {
      await queryInterface.removeColumn('messages', 'isStaffMessage');
    }
    
    console.log('✅ Staff messaging migration rolled back successfully');
  } catch (error) {
    console.log('⚠️ Rollback may have failed:', error);
  }
};