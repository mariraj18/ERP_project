import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isAnnouncement: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Made nullable for staff messages
    references: {
      model: 'users',
      key: 'id'
    }
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Made nullable for staff messages
    references: {
      model: 'users',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isStaffMessage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  messageType: {
    type: DataTypes.ENUM('INDIVIDUAL', 'CLASS', 'ALL_STUDENTS', 'EMAIL', 'STAFF_TO_ADMIN', 'ADMIN_TO_STAFF', 'STUDENT_TO_STAFF', 'STAFF_REPLY'),
    defaultValue: 'INDIVIDUAL'
  },
  studentMessageType: {
    type: DataTypes.ENUM('question', 'doubt', 'clarification', 'general'),
    allowNull: true,
    defaultValue: 'general'
  },
  replyToMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  emailType: {
    type: DataTypes.ENUM('STUDENT', 'PARENT'),
    allowNull: true
  },
  emailRecipients: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'classes',
      key: 'id'
    }
  }
}, {
  tableName: 'messages'
});

export default Message;