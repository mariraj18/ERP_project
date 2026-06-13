import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { User, Message, Attendance, LoginLog, Class } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get admin details (Super Admin only)
router.get('/admin-details', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const admin = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'lastLogin', 'loginCount']
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Get system statistics
    const [totalUsers, totalMessages, totalAttendance, totalClasses] = await Promise.all([
      User.count(),
      Message.count(),
      Attendance.count(),
      Class.count()
    ]);

    // Calculate database size (PostgreSQL specific)
    let databaseSize = 'Unknown';
    try {
      const dbSize = await sequelize.query(
        "SELECT pg_size_pretty(pg_database_size(current_database())) as size",
        { type: sequelize.QueryTypes.SELECT }
      );
      databaseSize = dbSize[0]?.size || 'Unknown';
    } catch (error) {
      console.error('Failed to get database size:', error);
    }

    res.json({
      admin,
      systemStats: {
        totalUsers,
        totalMessages,
        totalAttendance,
        totalClasses,
        databaseSize
      }
    });
  } catch (error) {
    console.error('Get admin details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update admin details (Super Admin only)
router.put('/admin-details', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: req.user.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email is already taken' });
    }

    // Update admin details
    const admin = await User.findByPk(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    await admin.update({
      name,
      email
    });

    // Return updated admin details
    const updatedAdmin = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'lastLogin', 'loginCount']
    });

    res.json({
      message: 'Admin details updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Update admin details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password (Super Admin only)
router.post('/change-password', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const admin = await User.findByPk(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await admin.update({
      passwordHash: hashedPassword
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create database backup (Super Admin only)
router.post('/backup', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { departmentId, dateFrom, dateTo, backupType = 'full' } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    let backupName = 'backup';
    if (backupType === 'department' && departmentId) {
      const { Department } = await import('../models/index.js');
      const deptInfo = await Department.findByPk(departmentId);
      backupName = `department_${deptInfo?.name || departmentId}_backup`;
    }
    if (dateFrom || dateTo) {
      backupName += `_${dateFrom || 'start'}_to_${dateTo || 'end'}`;
    }

    const sqlFileName = `${backupName}_${timestamp}.sql`;
    const zipFileName = `${backupName}_${timestamp}.zip`;
    const sqlFilePath = path.join(backupDir, sqlFileName);
    const zipFilePath = path.join(backupDir, zipFileName);

    if (backupType === 'department' && departmentId) {
      // Create department-specific backup using custom SQL
      await createDepartmentBackup(departmentId, dateFrom, dateTo, sqlFilePath, res);
    } else {
      // Create full database backup
      await createFullBackup(sqlFilePath, dateFrom, dateTo, res);
    }

    // Create ZIP file containing the SQL dump
    setTimeout(async () => {
      try {
        if (fs.existsSync(sqlFilePath)) {
          const output = fs.createWriteStream(zipFilePath);
          const archive = archiver('zip', { zlib: { level: 9 } });

          output.on('close', () => {
            // Clean up SQL file after zipping
            fs.unlinkSync(sqlFilePath);
            
            res.json({
              message: 'Backup created successfully',
              sqlFile: sqlFileName,
              zipFile: zipFileName,
              size: archive.pointer(),
              timestamp,
              backupType,
              classId: classId || null
            });
          });

          archive.on('error', (err) => {
            throw err;
          });

          archive.pipe(output);
          archive.file(sqlFilePath, { name: sqlFileName });
          await archive.finalize();
        }
      } catch (zipError) {
        console.error('ZIP creation error:', zipError);
        res.status(500).json({ 
          error: 'Failed to create ZIP backup',
          details: zipError.message 
        });
      }
    }, 2000);

  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to create full database backup
async function createFullBackup(sqlFilePath, dateFrom, dateTo, res) {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'college_attendance',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root1'
  };

  let pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f "${sqlFilePath}" --no-password`;
  
  // Add date filtering if specified
  if (dateFrom || dateTo) {
    // For date filtering, we'll need to create a custom backup
    await createCustomBackup(null, dateFrom, dateTo, sqlFilePath);
    return;
  }

  const env = { ...process.env, PGPASSWORD: dbConfig.password };

  exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({ 
        error: 'Failed to create database backup',
        details: error.message 
      });
    }
  });
}

// Helper function to create department-specific backup
async function createDepartmentBackup(departmentId, dateFrom, dateTo, sqlFilePath, res) {
  try {
    await createCustomDepartmentBackup(departmentId, dateFrom, dateTo, sqlFilePath);
  } catch (error) {
    console.error('Department backup error:', error);
    res.status(500).json({ 
      error: 'Failed to create department backup',
      details: error.message 
    });
  }
}

// Helper function to create custom backup with filtering
async function createCustomBackup(classId, dateFrom, dateTo, sqlFilePath) {
  let sqlContent = '-- Custom Backup Generated by College Attendance System\n';
  sqlContent += `-- Generated on: ${new Date().toISOString()}\n`;
  if (classId) {
    sqlContent += `-- Class ID: ${classId}\n`;
  }
  if (dateFrom || dateTo) {
    sqlContent += `-- Date Range: ${dateFrom || 'start'} to ${dateTo || 'end'}\n`;
  }
  sqlContent += '\n';

  // Build date filter condition
  let dateCondition = '';
  if (dateFrom || dateTo) {
    const conditions = [];
    if (dateFrom) conditions.push(`"createdAt" >= '${dateFrom}'`);
    if (dateTo) conditions.push(`"createdAt" <= '${dateTo} 23:59:59'`);
    dateCondition = ` AND ${conditions.join(' AND ')}`;
  }

  // Build class filter condition
  let classCondition = '';
  if (classId) {
    classCondition = ` AND "classId" = ${classId}`;
  }

  try {
    // Export Classes table (if class-specific, only the selected class)
    if (classId) {
      const classData = await Class.findByPk(classId);
      if (classData) {
        sqlContent += `-- Classes table\n`;
        sqlContent += `INSERT INTO "classes" ("id", "name", "staffId", "createdAt", "updatedAt") VALUES `;
        sqlContent += `(${classData.id}, '${classData.name}', ${classData.staffId || 'NULL'}, '${classData.createdAt}', '${classData.updatedAt}');\n\n`;
      }
    } else {
      const classes = await sequelize.query('SELECT * FROM "classes"', { type: sequelize.QueryTypes.SELECT });
      if (classes.length > 0) {
        sqlContent += `-- Classes table\n`;
        sqlContent += `INSERT INTO "classes" ("id", "name", "staffId", "createdAt", "updatedAt") VALUES\n`;
        sqlContent += classes.map(c => 
          `(${c.id}, '${c.name}', ${c.staffId || 'NULL'}, '${c.createdAt}', '${c.updatedAt}')`
        ).join(',\n') + ';\n\n';
      }
    }

    // Export Users (students and staff related to the class)
    let userQuery = 'SELECT * FROM "users" WHERE 1=1';
    if (classId) {
      userQuery += ` AND ("classId" = ${classId} OR "role" = 'STAFF' OR "role" = 'SUPER_ADMIN')`;
    }
    if (dateFrom || dateTo) {
      userQuery += dateCondition;
    }

    const users = await sequelize.query(userQuery, { type: sequelize.QueryTypes.SELECT });
    if (users.length > 0) {
      sqlContent += `-- Users table\n`;
      sqlContent += `INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "rollNumber", "parentEmail", "classId", "isActive", "lastLogin", "loginCount", "createdAt", "updatedAt") VALUES\n`;
      sqlContent += users.map(u => 
        `(${u.id}, '${u.name}', '${u.email}', '${u.passwordHash}', '${u.role}', ${u.rollNumber ? `'${u.rollNumber}'` : 'NULL'}, ${u.parentEmail ? `'${u.parentEmail}'` : 'NULL'}, ${u.classId || 'NULL'}, ${u.isActive}, ${u.lastLogin ? `'${u.lastLogin}'` : 'NULL'}, ${u.loginCount || 0}, '${u.createdAt}', '${u.updatedAt}')`
      ).join(',\n') + ';\n\n';
    }

    // Export Messages (both student and staff messages)
    let messageQuery = 'SELECT * FROM "messages" WHERE 1=1';
    if (classId) {
      const classStudents = await User.findAll({ 
        where: { classId, role: 'STUDENT' }, 
        attributes: ['id'] 
      });
      const studentIds = classStudents.map(s => s.id);
      if (studentIds.length > 0) {
        messageQuery += ` AND ("studentId" IN (${studentIds.join(',')}) OR "isStaffMessage" = true)`;
      }
    }
    messageQuery += dateCondition;

    const messages = await sequelize.query(messageQuery, { type: sequelize.QueryTypes.SELECT });
    if (messages.length > 0) {
      sqlContent += `-- Messages table (including staff messages)\n`;
      sqlContent += `INSERT INTO "messages" ("id", "content", "filePath", "fileName", "isAnnouncement", "studentId", "staffId", "senderId", "recipientId", "isRead", "isStaffMessage", "messageType", "classId", "createdAt", "updatedAt") VALUES\n`;
      sqlContent += messages.map(m => 
        `(${m.id}, '${m.content.replace(/'/g, "''")}', ${m.filePath ? `'${m.filePath}'` : 'NULL'}, ${m.fileName ? `'${m.fileName}'` : 'NULL'}, ${m.isAnnouncement || false}, ${m.studentId || 'NULL'}, ${m.staffId || 'NULL'}, ${m.senderId || 'NULL'}, ${m.recipientId || 'NULL'}, ${m.isRead}, ${m.isStaffMessage || false}, '${m.messageType}', ${m.classId || 'NULL'}, '${m.createdAt}', '${m.updatedAt}')`
      ).join(',\n') + ';\n\n';
    }

    // Export Attendance
    let attendanceQuery = 'SELECT * FROM "attendances" WHERE 1=1';
    if (classId) {
      const classStudents = await User.findAll({ 
        where: { classId, role: 'STUDENT' }, 
        attributes: ['id'] 
      });
      const studentIds = classStudents.map(s => s.id);
      if (studentIds.length > 0) {
        attendanceQuery += ` AND "studentId" IN (${studentIds.join(',')})`;
      }
    }
    attendanceQuery += dateCondition;

    const attendance = await sequelize.query(attendanceQuery, { type: sequelize.QueryTypes.SELECT });
    if (attendance.length > 0) {
      sqlContent += `-- Attendance table\n`;
      sqlContent += `INSERT INTO "attendances" ("id", "studentId", "date", "status", "createdAt", "updatedAt") VALUES\n`;
      sqlContent += attendance.map(a => 
        `(${a.id}, ${a.studentId}, '${a.date}', '${a.status}', '${a.createdAt}', '${a.updatedAt}')`
      ).join(',\n') + ';\n\n';
    }

    // Write to file
    fs.writeFileSync(sqlFilePath, sqlContent);

  } catch (error) {
    console.error('Custom backup error:', error);
    throw error;
  }
}

// Helper function to create custom department backup
async function createCustomDepartmentBackup(departmentId, dateFrom, dateTo, sqlFilePath) {
  const { Department } = await import('../models/index.js');
  
  let sqlContent = '-- Department Backup Generated by College Attendance System\n';
  sqlContent += `-- Generated on: ${new Date().toISOString()}\n`;
  sqlContent += `-- Department ID: ${departmentId}\n`;
  if (dateFrom || dateTo) {
    sqlContent += `-- Date Range: ${dateFrom || 'start'} to ${dateTo || 'end'}\n`;
  }
  sqlContent += '\n';

  // Build date filter condition
  let dateCondition = '';
  if (dateFrom || dateTo) {
    const conditions = [];
    if (dateFrom) conditions.push(`"createdAt" >= '${dateFrom}'`);
    if (dateTo) conditions.push(`"createdAt" <= '${dateTo} 23:59:59'`);
    dateCondition = ` AND ${conditions.join(' AND ')}`;
  }

  try {
    // Export Department table
    const department = await Department.findByPk(departmentId);
    if (department) {
      sqlContent += `-- Department table\n`;
      sqlContent += `INSERT INTO "departments" ("id", "name", "description", "headId", "isActive", "createdAt", "updatedAt") VALUES `;
      sqlContent += `(${department.id}, '${department.name}', ${department.description ? `'${department.description}'` : 'NULL'}, ${department.headId || 'NULL'}, ${department.isActive}, '${department.createdAt}', '${department.updatedAt}');\n\n`;
    }

    // Export Classes in the department
    const classes = await Class.findAll({ where: { departmentId } });
    if (classes.length > 0) {
      sqlContent += `-- Classes table\n`;
      sqlContent += `INSERT INTO "classes" ("id", "name", "staffId", "departmentId", "createdAt", "updatedAt") VALUES\n`;
      sqlContent += classes.map(c => 
        `(${c.id}, '${c.name}', ${c.staffId || 'NULL'}, ${c.departmentId}, '${c.createdAt}', '${c.updatedAt}')`
      ).join(',\n') + ';\n\n';
    }

    // Export Users (students and staff in the department)
    const users = await User.findAll({ where: { departmentId } });
    if (users.length > 0) {
      sqlContent += `-- Users table\n`;
      sqlContent += `INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "rollNumber", "parentEmail", "classId", "departmentId", "isActive", "lastLogin", "loginCount", "createdAt", "updatedAt") VALUES\n`;
      sqlContent += users.map(u => 
        `(${u.id}, '${u.name}', '${u.email}', '${u.passwordHash}', '${u.role}', ${u.rollNumber ? `'${u.rollNumber}'` : 'NULL'}, ${u.parentEmail ? `'${u.parentEmail}'` : 'NULL'}, ${u.classId || 'NULL'}, ${u.departmentId}, ${u.isActive}, ${u.lastLogin ? `'${u.lastLogin}'` : 'NULL'}, ${u.loginCount || 0}, '${u.createdAt}', '${u.updatedAt}')`
      ).join(',\n') + ';\n\n';
    }

    // Export Messages for department students
    const departmentStudents = await User.findAll({ 
      where: { departmentId, role: 'STUDENT' }, 
      attributes: ['id'] 
    });
    const studentIds = departmentStudents.map(s => s.id);
    
    if (studentIds.length > 0) {
      let messageQuery = `SELECT * FROM "messages" WHERE "studentId" IN (${studentIds.join(',')})`;
      messageQuery += dateCondition;
      
      const messages = await sequelize.query(messageQuery, { type: sequelize.QueryTypes.SELECT });
      if (messages.length > 0) {
        sqlContent += `-- Messages table\n`;
        sqlContent += `INSERT INTO "messages" ("id", "content", "filePath", "fileName", "isAnnouncement", "studentId", "staffId", "senderId", "recipientId", "isRead", "isStaffMessage", "messageType", "classId", "createdAt", "updatedAt") VALUES\n`;
        sqlContent += messages.map(m => 
          `(${m.id}, '${m.content.replace(/'/g, "''")}', ${m.filePath ? `'${m.filePath}'` : 'NULL'}, ${m.fileName ? `'${m.fileName}'` : 'NULL'}, ${m.isAnnouncement || false}, ${m.studentId || 'NULL'}, ${m.staffId || 'NULL'}, ${m.senderId || 'NULL'}, ${m.recipientId || 'NULL'}, ${m.isRead}, ${m.isStaffMessage || false}, '${m.messageType}', ${m.classId || 'NULL'}, '${m.createdAt}', '${m.updatedAt}')`
        ).join(',\n') + ';\n\n';
      }
    }

    // Export Attendance for department students
    if (studentIds.length > 0) {
      let attendanceQuery = `SELECT * FROM "attendances" WHERE "studentId" IN (${studentIds.join(',')})`;
      attendanceQuery += dateCondition;
      
      const attendance = await sequelize.query(attendanceQuery, { type: sequelize.QueryTypes.SELECT });
      if (attendance.length > 0) {
        sqlContent += `-- Attendance table\n`;
        sqlContent += `INSERT INTO "attendances" ("id", "studentId", "date", "status", "createdAt", "updatedAt") VALUES\n`;
        sqlContent += attendance.map(a => 
          `(${a.id}, ${a.studentId}, '${a.date}', '${a.status}', '${a.createdAt}', '${a.updatedAt}')`
        ).join(',\n') + ';\n\n';
      }
    }

    // Write to file
    fs.writeFileSync(sqlFilePath, sqlContent);

  } catch (error) {
    console.error('Department backup error:', error);
    throw error;
  }
}

// Download backup file (Super Admin only)
router.get('/backup/download/:filename', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, filename);

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    const stat = fs.statSync(filePath);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get list of available backups (Super Admin only)
router.get('/backups', authenticateToken, requireRole('SUPER_ADMIN'), (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.zip') || file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stat = fs.statSync(filePath);
        return {
          filename: file,
          size: stat.size,
          created: stat.birthtime,
          type: file.endsWith('.zip') ? 'zip' : 'sql'
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ backups: files });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clean old data (Super Admin only)
router.post('/cleanup', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      retentionDays = 30, 
      departmentId, 
      dateFrom, 
      dateTo, 
      cleanupType = 'data_only',
      deleteImportantData = false 
    } = req.body;
    
    if (retentionDays < 1 || retentionDays > 365) {
      return res.status(400).json({ error: 'Retention days must be between 1 and 365' });
    }

    const results = {};

    // Build date conditions
    let dateConditions = {};
    if (dateFrom && dateTo) {
      dateConditions = {
        createdAt: {
          [Op.between]: [dateFrom, `${dateTo} 23:59:59`]
        }
      };
    } else if (dateFrom) {
      dateConditions = {
        createdAt: {
          [Op.gte]: dateFrom
        }
      };
    } else if (dateTo) {
      dateConditions = {
        createdAt: {
          [Op.lte]: `${dateTo} 23:59:59`
        }
      };
    } else {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      dateConditions = {
        createdAt: {
          [Op.lt]: cutoffDate
        }
      };
    }

    if (cleanupType === 'complete_department_deletion' && departmentId && deleteImportantData) {
      // Complete department deletion including important data
      await performCompleteDepartmentDeletion(departmentId, results);
    } else {
      // Regular cleanup (data only)
      await performRegularCleanup(departmentId, dateConditions, results, deleteImportantData);
    }

    res.json({
      message: `Successfully cleaned data`,
      results,
      cleanupType,
      departmentId: departmentId || null
    });

  } catch (error) {
    console.error('Data cleanup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function for complete department deletion
async function performCompleteDepartmentDeletion(departmentId, results) {
  const { Department } = await import('../models/index.js');
  const transaction = await sequelize.transaction();
  
  try {
    // Get all students in the department
    const deptStudents = await User.findAll({
      where: { departmentId, role: 'STUDENT' },
      attributes: ['id'],
      transaction
    });
    const studentIds = deptStudents.map(s => s.id);

    if (studentIds.length > 0) {
      // Delete all messages for these students
      const deletedMessages = await Message.destroy({
        where: { studentId: { [Op.in]: studentIds } },
        transaction
      });
      results.deletedMessages = deletedMessages;

      // Delete all attendance records for these students
      const deletedAttendance = await Attendance.destroy({
        where: { studentId: { [Op.in]: studentIds } },
        transaction
      });
      results.deletedAttendance = deletedAttendance;

      // Delete all login logs for these students
      const deletedLoginLogs = await LoginLog.destroy({
        where: { userId: { [Op.in]: studentIds } },
        transaction
      });
      results.deletedLoginLogs = deletedLoginLogs;

      // Delete the students themselves
      const deletedStudents = await User.destroy({
        where: { departmentId, role: 'STUDENT' },
        transaction
      });
      results.deletedStudents = deletedStudents;
    }

    // Delete all classes in the department
    const deletedClasses = await Class.destroy({
      where: { departmentId },
      transaction
    });
    results.deletedClasses = deletedClasses;

    // Delete the department itself
    const deletedDepartments = await Department.destroy({
      where: { id: departmentId },
      transaction
    });
    results.deletedDepartments = deletedDepartments;

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Helper function for complete class deletion
async function performCompleteClassDeletion(classId, results) {
  const transaction = await sequelize.transaction();
  
  try {
    // Get all students in the class
    const classStudents = await User.findAll({
      where: { classId, role: 'STUDENT' },
      attributes: ['id'],
      transaction
    });
    const studentIds = classStudents.map(s => s.id);

    if (studentIds.length > 0) {
      // Delete all messages for these students
      const deletedMessages = await Message.destroy({
        where: { studentId: { [Op.in]: studentIds } },
        transaction
      });
      results.deletedMessages = deletedMessages;

      // Delete all attendance records for these students
      const deletedAttendance = await Attendance.destroy({
        where: { studentId: { [Op.in]: studentIds } },
        transaction
      });
      results.deletedAttendance = deletedAttendance;

      // Delete all login logs for these students
      const deletedLoginLogs = await LoginLog.destroy({
        where: { userId: { [Op.in]: studentIds } },
        transaction
      });
      results.deletedLoginLogs = deletedLoginLogs;

      // Delete the students themselves
      const deletedStudents = await User.destroy({
        where: { classId, role: 'STUDENT' },
        transaction
      });
      results.deletedStudents = deletedStudents;
    }

    // Delete the class itself
    const deletedClasses = await Class.destroy({
      where: { id: classId },
      transaction
    });
    results.deletedClasses = deletedClasses;

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Helper function for regular cleanup
async function performRegularCleanup(departmentId, dateConditions, results, deleteImportantData) {
  let messageConditions = { ...dateConditions };
  let attendanceConditions = { ...dateConditions };
  let loginLogConditions = { ...dateConditions };
  let userConditions = { ...dateConditions };

  // Add department filtering if specified
  if (departmentId) {
    const deptStudents = await User.findAll({
      where: { departmentId, role: 'STUDENT' },
      attributes: ['id']
    });
    const studentIds = deptStudents.map(s => s.id);

    if (studentIds.length > 0) {
      messageConditions.studentId = { [Op.in]: studentIds };
      attendanceConditions.studentId = { [Op.in]: studentIds };
      loginLogConditions.userId = { [Op.in]: studentIds };
      
      if (deleteImportantData) {
        userConditions.id = { [Op.in]: studentIds };
      }
    }
  }

  // Delete messages (both student and staff messages)
  const deletedMessages = await Message.destroy({
    where: messageConditions
  });
  results.deletedMessages = deletedMessages;

  // Delete staff messages separately
  const deletedStaffMessages = await Message.destroy({
    where: { ...dateConditions, isStaffMessage: true }
  });
  results.deletedStaffMessages = deletedStaffMessages;

  // Delete attendance records
  const deletedAttendance = await Attendance.destroy({
    where: attendanceConditions
  });
  results.deletedAttendance = deletedAttendance;

  // Delete login logs
  const deletedLoginLogs = await LoginLog.destroy({
    where: loginLogConditions
  });
  results.deletedLoginLogs = deletedLoginLogs;

  // Delete users if deleteImportantData is true
  if (deleteImportantData) {
    if (departmentId) {
      const deletedUsers = await User.destroy({
        where: userConditions
      });
      results.deletedUsers = deletedUsers;
    } else {
      // Don't delete all users unless specifically requested
      results.deletedUsers = 0;
    }
  }
}

// Get cleanup preview (Super Admin only)
router.get('/cleanup/preview', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      retentionDays = 30, 
      departmentId, 
      dateFrom, 
      dateTo, 
      cleanupType = 'data_only',
      deleteImportantData = false 
    } = req.query;

    let dateConditions = {};
    if (dateFrom && dateTo) {
      dateConditions = {
        createdAt: {
          [Op.between]: [dateFrom, `${dateTo} 23:59:59`]
        }
      };
    } else if (dateFrom) {
      dateConditions = {
        createdAt: {
          [Op.gte]: dateFrom
        }
      };
    } else if (dateTo) {
      dateConditions = {
        createdAt: {
          [Op.lte]: `${dateTo} 23:59:59`
        }
      };
    } else {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(retentionDays));
      dateConditions = {
        createdAt: {
          [Op.lt]: cutoffDate
        }
      };
    }

    let preview = {};

    if (cleanupType === 'complete_department_deletion' && departmentId && deleteImportantData === 'true') {
      // Preview complete department deletion
      const deptStudents = await User.findAll({
        where: { departmentId, role: 'STUDENT' },
      });
      const studentIds = deptStudents.map(s => s.id);

      // Get classes in the department
      const deptClasses = await Class.count({ where: { departmentId } });

      if (studentIds.length > 0) {
        const [messagesToDelete, attendanceToDelete, loginLogsToDelete, staffMessagesToDelete] = await Promise.all([
          Message.count({ where: { studentId: { [Op.in]: studentIds } } }),
          Attendance.count({ where: { studentId: { [Op.in]: studentIds } } }),
          LoginLog.count({ where: { userId: { [Op.in]: studentIds } } }),
          Message.count({ where: { [Op.or]: [{ senderId: { [Op.in]: studentIds } }, { recipientId: { [Op.in]: studentIds } }], isStaffMessage: true } })
        ]);

        preview = {
          messagesToDelete,
          attendanceToDelete,
          loginLogsToDelete,
          staffMessagesToDelete,
          studentsToDelete: studentIds.length,
          classesToDelete: deptClasses,
          departmentsToDelete: 1,
          totalRecords: messagesToDelete + attendanceToDelete + loginLogsToDelete + studentIds.length + deptClasses + 1
        };
      } else {
        preview = {
          messagesToDelete: 0,
          attendanceToDelete: 0,
          loginLogsToDelete: 0,
          staffMessagesToDelete: 0,
          studentsToDelete: 0,
          classesToDelete: deptClasses,
          departmentsToDelete: 1,
          totalRecords: deptClasses + 1
        };
      }
    } else {
      // Regular cleanup preview
      let messageConditions = { ...dateConditions };
      let attendanceConditions = { ...dateConditions };
      let loginLogConditions = { ...dateConditions };
      let userConditions = { ...dateConditions };

      if (departmentId) {
        const deptStudents = await User.findAll({
          where: { departmentId, role: 'STUDENT' },
          attributes: ['id']
        });
        const studentIds = deptStudents.map(s => s.id);

        if (studentIds.length > 0) {
          messageConditions.studentId = { [Op.in]: studentIds };
          attendanceConditions.studentId = { [Op.in]: studentIds };
          loginLogConditions.userId = { [Op.in]: studentIds };
          
          if (deleteImportantData === 'true') {
            userConditions.id = { [Op.in]: studentIds };
          }
        }
      }

      const [messagesToDelete, attendanceToDelete, loginLogsToDelete, staffMessagesToDelete] = await Promise.all([
        Message.count({ where: messageConditions }),
        Attendance.count({ where: attendanceConditions }),
        LoginLog.count({ where: loginLogConditions }),
        Message.count({ where: { ...dateConditions, isStaffMessage: true } })
      ]);

      let usersToDelete = 0;
      if (deleteImportantData === 'true' && departmentId) {
        usersToDelete = await User.count({ where: userConditions });
      }

      preview = {
        messagesToDelete,
        attendanceToDelete,
        loginLogsToDelete,
        staffMessagesToDelete,
        usersToDelete,
        totalRecords: messagesToDelete + attendanceToDelete + loginLogsToDelete + staffMessagesToDelete + usersToDelete
      };
    }

    res.json({
      retentionDays: parseInt(retentionDays),
      dateFrom,
      dateTo,
      departmentId,
      cleanupType,
      deleteImportantData: deleteImportantData === 'true',
      preview
    });

  } catch (error) {
    console.error('Cleanup preview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;