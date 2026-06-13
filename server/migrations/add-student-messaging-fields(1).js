import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Migration to add enhanced student-staff messaging fields
 * This adds support for:
 * - Student to staff messaging with message types (question, doubt, clarification, general)
 * - Staff replies to student messages
 * - Reply threading through replyToMessageId
 */
async function addStudentMessagingFields() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Starting student messaging fields migration...');
    
    // Get the current message types enum to extend it
    const queryInterface = sequelize.getQueryInterface();
    
    // Add new message types to the messageType enum
    console.log('📝 Adding new message types to enum...');
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_messages_messageType" ADD VALUE 'STUDENT_TO_STAFF';
    `, { transaction });
    
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_messages_messageType" ADD VALUE 'STAFF_REPLY';
    `, { transaction });
    
    // Add studentMessageType enum column
    console.log('📝 Creating studentMessageType enum type...');
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_messages_studentMessageType" AS ENUM ('question', 'doubt', 'clarification', 'general');
    `, { transaction });
    
    // Add studentMessageType column
    console.log('📝 Adding studentMessageType column...');
    await queryInterface.addColumn('messages', 'studentMessageType', {
      type: 'enum_messages_studentMessageType',
      allowNull: true,
      defaultValue: 'general'
    }, { transaction });
    
    // Add replyToMessageId column for threading
    console.log('📝 Adding replyToMessageId column...');
    await queryInterface.addColumn('messages', 'replyToMessageId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }, { transaction });
    
    // Add index for better performance on reply lookups
    console.log('📝 Creating indexes for better performance...');
    await queryInterface.addIndex('messages', ['replyToMessageId'], {
      name: 'messages_replyToMessageId_idx',
      transaction
    });
    
    // Add index for student message types
    await queryInterface.addIndex('messages', ['messageType', 'studentMessageType'], {
      name: 'messages_messageType_studentMessageType_idx',
      transaction
    });
    
    // Add index for staff-student message lookups
    await queryInterface.addIndex('messages', ['staffId', 'messageType'], {
      name: 'messages_staffId_messageType_idx',
      transaction
    });
    
    await transaction.commit();
    console.log('✅ Student messaging fields migration completed successfully!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback function - removes the added fields
 */
async function removeStudentMessagingFields() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Rolling back student messaging fields migration...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Remove indexes
    console.log('📝 Removing indexes...');
    await queryInterface.removeIndex('messages', 'messages_replyToMessageId_idx', { transaction });
    await queryInterface.removeIndex('messages', 'messages_messageType_studentMessageType_idx', { transaction });
    await queryInterface.removeIndex('messages', 'messages_staffId_messageType_idx', { transaction });
    
    // Remove columns
    console.log('📝 Removing replyToMessageId column...');
    await queryInterface.removeColumn('messages', 'replyToMessageId', { transaction });
    
    console.log('📝 Removing studentMessageType column...');
    await queryInterface.removeColumn('messages', 'studentMessageType', { transaction });
    
    // Drop the enum type
    console.log('📝 Dropping studentMessageType enum type...');
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_messages_studentMessageType";
    `, { transaction });
    
    // Note: We cannot easily remove enum values from existing enum types in PostgreSQL
    // The new message types will remain in the enum but won't be used
    console.log('⚠️ Note: STUDENT_TO_STAFF and STAFF_REPLY values remain in messageType enum (cannot be removed safely)');
    
    await transaction.commit();
    console.log('✅ Student messaging fields rollback completed!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Export functions for manual execution
export { addStudentMessagingFields, removeStudentMessagingFields };

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Running student messaging fields migration...');
  
  addStudentMessagingFields()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}