import User from './User.js';
import Message from './Message.js';
import Class from './Class.js';
import LoginLog from './LoginLog.js';
import Department from './Department.js';
import StaffClass from './StaffClass.js';

// Try to import Attendance if it exists
let Attendance = null;
try {
  const AttendanceModule = await import('./Attendance.js');
  Attendance = AttendanceModule.default;
  console.log('✅ Attendance model loaded');
} catch (error) {
  console.log('⚠️ Attendance model not found - creating placeholder');
  // Create a simple placeholder to avoid errors
  Attendance = class Attendance {};
}

// Define associations
User.hasMany(Message, { 
  as: 'receivedMessages', 
  foreignKey: 'studentId',
  onDelete: 'CASCADE'
});

User.hasMany(Message, { 
  as: 'sentMessages', 
  foreignKey: 'staffId',
  onDelete: 'CASCADE'
});

Message.belongsTo(User, { 
  as: 'student', 
  foreignKey: 'studentId' 
});

Message.belongsTo(User, { 
  as: 'staff', 
  foreignKey: 'staffId' 
});

// Class associations - Keep backward compatibility with single staff assignment
Class.belongsTo(User, { 
  as: 'staff', 
  foreignKey: 'staffId' 
});

User.hasOne(Class, { 
  as: 'managedClass', 
  foreignKey: 'staffId' 
});

// Many-to-many staff-class associations through StaffClass junction table
User.belongsToMany(Class, {
  through: StaffClass,
  as: 'assignedClasses',
  foreignKey: 'staffId',
  otherKey: 'classId'
});

Class.belongsToMany(User, {
  through: StaffClass,
  as: 'assignedStaff',
  foreignKey: 'classId',
  otherKey: 'staffId'
});

// Direct associations to the junction table
StaffClass.belongsTo(User, {
  as: 'staff',
  foreignKey: 'staffId'
});

StaffClass.belongsTo(Class, {
  as: 'class',
  foreignKey: 'classId'
});

StaffClass.belongsTo(User, {
  as: 'assignedByUser',
  foreignKey: 'assignedBy'
});

// Student-class relationship
User.belongsTo(Class, { 
  as: 'class', 
  foreignKey: 'classId' 
});

Class.hasMany(User, { 
  as: 'students', 
  foreignKey: 'classId' 
});

// Message-Class relationship
Message.belongsTo(Class, { 
  as: 'class', 
  foreignKey: 'classId' 
});

Class.hasMany(Message, { 
  as: 'messages', 
  foreignKey: 'classId' 
});

// Login logs
User.hasMany(LoginLog, { 
  as: 'loginLogs', 
  foreignKey: 'userId', 
  onDelete: 'CASCADE' 
});

LoginLog.belongsTo(User, { 
  as: 'user', 
  foreignKey: 'userId' 
});

// Department associations
Department.hasMany(User, { 
  as: 'users', 
  foreignKey: 'departmentId' 
});

User.belongsTo(Department, { 
  as: 'department', 
  foreignKey: 'departmentId' 
});

Department.hasMany(Class, { 
  as: 'classes', 
  foreignKey: 'departmentId' 
});

Class.belongsTo(Department, { 
  as: 'department', 
  foreignKey: 'departmentId' 
});

// Department head association
Department.belongsTo(User, {
  as: 'head',
  foreignKey: 'headId'
});

// Attendance associations (only if Attendance exists)
if (Attendance && Attendance !== class Attendance {}) {
  User.hasMany(Attendance, { 
    as: 'studentAttendances', 
    foreignKey: 'studentId',
    onDelete: 'CASCADE'
  });

  User.hasMany(Attendance, { 
    as: 'staffAttendances', 
    foreignKey: 'staffId',
    onDelete: 'CASCADE'
  });

  Attendance.belongsTo(User, { 
    as: 'student', 
    foreignKey: 'studentId' 
  });

  Attendance.belongsTo(User, { 
    as: 'staff', 
    foreignKey: 'staffId' 
  });
}

// Export all models
export { 
  User, 
  Message, 
  Class, 
  LoginLog, 
  Department,
  StaffClass,
  Attendance 
};
