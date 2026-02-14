import { DataTypes } from 'sequelize';

export const up = async (queryInterface) => {
  try {
    console.log('🔄 Running email functionality migration...');
    
    const tableInfo = await queryInterface.describeTable('messages');
    
    // Add emailType column if it doesn't exist
    if (!tableInfo.emailType) {
      await queryInterface.addColumn('messages', 'emailType', {
        type: DataTypes.STRING, // Using STRING instead of ENUM for PostgreSQL compatibility
        allowNull: true
      });
      console.log('✅ Added emailType column');
    } else {
      console.log('⚠️ emailType column already exists');
    }

    // Add emailRecipients column if it doesn't exist
    if (!tableInfo.emailRecipients) {
      await queryInterface.addColumn('messages', 'emailRecipients', {
        type: DataTypes.TEXT,
        allowNull: true
      });
      console.log('✅ Added emailRecipients column');
    } else {
      console.log('⚠️ emailRecipients column already exists');
    }

    console.log('✅ Email functionality migration completed successfully');
  } catch (error) {
    console.error('❌ Email functionality migration failed:', error);
  }
};

export const down = async (queryInterface) => {
  try {
    const tableInfo = await queryInterface.describeTable('messages');
    
    // Remove the columns if they exist
    if (tableInfo.emailType) {
      await queryInterface.removeColumn('messages', 'emailType');
    }
    
    if (tableInfo.emailRecipients) {
      await queryInterface.removeColumn('messages', 'emailRecipients');
    }

    console.log('✅ Email functionality migration rolled back successfully');
  } catch (error) {
    console.error('❌ Email functionality rollback failed:', error);
  }
};