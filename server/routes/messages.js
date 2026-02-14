import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Message, User, Class, Department } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../config/email.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// (Route moved below after 'upload' is declared)

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Office documents are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Send message to student (Staff only)
router.post('/send', authenticateToken, requireRole('STAFF'), upload.single('file'), async (req, res) => {
  try {
    const { studentId, content, classId, departmentId, isAnnouncement } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // For individual messages, studentId is required
    if (!isAnnouncement && !studentId) {
      return res.status(400).json({ error: 'Student ID is required for individual messages' });
    }

    let messageData;

    if (isAnnouncement === 'true') {
      // Handle announcement - send to all students in the class, department, or all classes
      const whereCondition = { 
        role: 'STUDENT', 
        isActive: true 
      };
      
      // Staff can only send to their own department unless they're super admin
      if (req.user.role === 'STAFF' && req.user.departmentId) {
        whereCondition.departmentId = req.user.departmentId;
      }
      
      // If departmentId is provided and user is super admin, filter by department
      if (departmentId && departmentId !== 'ALL' && req.user.role === 'SUPER_ADMIN') {
        whereCondition.departmentId = departmentId;
      }
      
      // If classId is provided and not 'ALL', filter by class
      if (classId && classId !== 'ALL') {
        whereCondition.classId = classId;
      }

      const students = await User.findAll({ 
        where: whereCondition,
        attributes: ['id'] 
      });

      if (students.length === 0) {
        return res.status(404).json({ error: 'No active students found' });
      }

      // Create announcement for each student
      const announcementPromises = students.map(student => 
        Message.create({
          studentId: student.id,
          staffId: req.user.id,
          content,
          filePath: req.file ? req.file.path : null,
          fileName: req.file ? req.file.originalname : null,
          isAnnouncement: true,
          messageType: 'ALL_STUDENTS'
        })
      );

      await Promise.all(announcementPromises);

      return res.status(201).json({ 
        message: `Announcement sent to ${students.length} students successfully!`,
        recipients: students.length,
        isAnnouncement: true
      });

    } else {
      // Handle individual message
      const student = await User.findOne({
        where: { 
          id: studentId, 
          role: 'STUDENT', 
          isActive: true 
        }
      });

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      messageData = {
        studentId,
        staffId: req.user.id,
        content,
        filePath: req.file ? req.file.path : null,
        fileName: req.file ? req.file.originalname : null,
        isAnnouncement: false
      };

      const message = await Message.create(messageData);

      const messageWithDetails = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'name', 'rollNumber', 'classId']
          },
          {
            model: User,
            as: 'staff',
            attributes: ['id', 'name']
          }
        ]
      });

      return res.status(201).json(messageWithDetails);
    }

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send announcement to all students (Staff only) - Keep this for backward compatibility
router.post('/announcement', authenticateToken, requireRole('STAFF'), upload.single('file'), async (req, res) => {
  try {
    const { content, classId, departmentId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required for announcements' });
    }

    const whereCondition = { 
      role: 'STUDENT', 
      isActive: true 
    };
    
    // Staff can only send to their own department
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      whereCondition.departmentId = req.user.departmentId;
    }
    
    // If departmentId is provided and user is super admin, filter by department
    if (departmentId && departmentId !== 'ALL' && req.user.role === 'SUPER_ADMIN') {
      whereCondition.departmentId = departmentId;
    }
    
    if (classId && classId !== 'ALL') {
      whereCondition.classId = classId;
    }

    const students = await User.findAll({ 
      where: whereCondition,
      attributes: ['id'] 
    });

    if (students.length === 0) {
      return res.status(404).json({ error: 'No active students found' });
    }

    const announcementPromises = students.map(student => 
      Message.create({
        studentId: student.id,
        staffId: req.user.id,
        content,
        filePath: req.file ? req.file.path : null,
        fileName: req.file ? req.file.originalname : null,
        isAnnouncement: true
      })
    );

    await Promise.all(announcementPromises);

    res.status(201).json({ 
      message: `Announcement sent to ${students.length} students successfully!`,
      recipients: students.length
    });
  } catch (error) {
    console.error('Send announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages sent by staff (Staff and Super Admin)
router.get('/sent', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    // Pagination
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '10', 10) || 10));
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Message.findAndCountAll({
      where: { staffId: req.user.id },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'rollNumber', 'classId']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset
    });

    const totalPages = Math.ceil(count / pageSize);
    res.json({
      rows,
      count,
      currentPage: page,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Other routes remain the same...
router.get('/received', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    // Pagination
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '20', 10) || 20));
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Message.findAndCountAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'name', 'role']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset
    });

    const totalPages = Math.ceil(count / pageSize);
    res.json({
      rows,
      count,
      currentPage: page,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    });
  } catch (error) {
    console.error('Get received messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/read', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const message = await Message.findOne({
      where: { 
        id: req.params.id,
        studentId: req.user.id 
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await message.update({ isRead: true });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message || !message.filePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (req.user.role === 'STUDENT' && message.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'STAFF' && message.staffId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path.resolve(message.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath, message.fileName);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message to entire class (Staff and Super Admin)
router.post('/send-to-class', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), upload.single('file'), async (req, res) => {
  try {
    const { classId, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Verify the class exists
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get all students in the class (with department filtering for staff)
    const studentWhereClause = {
      classId: classId,
      role: 'STUDENT',
      isActive: true
    };
    
    // Staff can only send to students in their department
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      studentWhereClause.departmentId = req.user.departmentId;
    }
    
    const students = await User.findAll({
      where: studentWhereClause,
      attributes: ['id']
    });

    if (students.length === 0) {
      return res.status(404).json({ error: 'No active students found in this class' });
    }

    // Create message for each student in the class
    const messagePromises = students.map(student => 
      Message.create({
        studentId: student.id,
        staffId: req.user.id,
        content,
        filePath: req.file ? req.file.path : null,
        fileName: req.file ? req.file.originalname : null,
        isAnnouncement: false, // Class messages are not announcements
        messageType: 'CLASS',
        classId: classId
      })
    );

    await Promise.all(messagePromises);

    res.status(201).json({
      message: `Message sent to all ${students.length} students in the class successfully!`,
      recipients: students.length,
      classId: classId
    });
  } catch (error) {
    console.error('Send class message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message to selected group of students (Staff only)
router.post('/send-to-group', authenticateToken, requireRole('STAFF'), upload.single('file'), async (req, res) => {
  try {
    const { studentIds, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    let parsedStudentIds;
    try {
      parsedStudentIds = typeof studentIds === 'string' ? JSON.parse(studentIds) : studentIds;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid student IDs format' });
    }

    if (!Array.isArray(parsedStudentIds) || parsedStudentIds.length === 0) {
      return res.status(400).json({ error: 'At least one student ID is required' });
    }

    // Verify all students exist, are active, and belong to staff's department
    const studentWhereClause = {
      id: parsedStudentIds,
      role: 'STUDENT',
      isActive: true
    };
    
    // Staff can only send to students in their department
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      studentWhereClause.departmentId = req.user.departmentId;
    }
    
    const students = await User.findAll({
      where: studentWhereClause,
      attributes: ['id', 'name']
    });

    if (students.length !== parsedStudentIds.length) {
      return res.status(400).json({ error: 'Some students not found or inactive' });
    }

    // Create message for each selected student
    const messagePromises = students.map(student => 
      Message.create({
        studentId: student.id,
        staffId: req.user.id,
        content,
        filePath: req.file ? req.file.path : null,
        fileName: req.file ? req.file.originalname : null,
        isAnnouncement: false
      })
    );

    await Promise.all(messagePromises);

    res.status(201).json({
      message: `Message sent to ${students.length} selected students successfully!`,
      recipients: students.length,
      studentNames: students.map(s => s.name)
    });
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send announcement to all students (Staff and Super Admin)
router.post('/send-to-all-students', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), upload.single('file'), async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get all active students (with department filtering for staff)
    const studentWhereClause = {
      role: 'STUDENT',
      isActive: true
    };
    
    // Staff can only send to students in their department
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      studentWhereClause.departmentId = req.user.departmentId;
    }
    
    const students = await User.findAll({
      where: studentWhereClause,
      attributes: ['id']
    });

    if (students.length === 0) {
      return res.status(404).json({ error: 'No active students found' });
    }

    // Create an announcement message for each student
    const createPromises = students.map(student =>
      Message.create({
        studentId: student.id,
        staffId: req.user.id,
        content,
        filePath: req.file ? req.file.path : null,
        fileName: req.file ? req.file.originalname : null,
        isAnnouncement: true,
        messageType: 'ALL_STUDENTS'
      })
    );

    await Promise.all(createPromises);

    return res.status(201).json({
      message: `Announcement sent to ${students.length} students successfully!`,
      recipients: students.length,
      isAnnouncement: true
    });
  } catch (error) {
    console.error('Send announcement to all students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send email to selected students/parents (Super Admin only)
router.post('/send-email', authenticateToken, requireRole('SUPER_ADMIN'), upload.single('file'), async (req, res) => {
  try {
    const { recipients, content, subject, emailType } = req.body;

    if (!content || !subject) {
      return res.status(400).json({ error: 'Content and subject are required' });
    }

    let parsedRecipients;
    try {
      parsedRecipients = typeof recipients === 'string' ? JSON.parse(recipients) : recipients;
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid recipients format' });
    }

    if (!Array.isArray(parsedRecipients) || parsedRecipients.length === 0) {
      return res.status(400).json({ error: 'At least one recipient is required' });
    }

    if (!emailType || !['STUDENT', 'PARENT'].includes(emailType)) {
      return res.status(400).json({ error: 'Valid email type (STUDENT or PARENT) is required' });
    }

    // Get student details for the selected recipients
    const students = await User.findAll({
      where: {
        id: parsedRecipients,
        role: 'STUDENT',
        isActive: true
      },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['id', 'name', 'email', 'parentEmail', 'rollNumber']
    });

    if (students.length !== parsedRecipients.length) {
      return res.status(400).json({ error: 'Some students not found or inactive' });
    }

    // Prepare email recipients
    const emailPromises = [];
    const successfulRecipients = [];

    for (const student of students) {
      let recipientEmail;
      let recipientName;

      if (emailType === 'STUDENT') {
        recipientEmail = student.email;
        recipientName = student.name;
      } else {
        if (!student.parentEmail) {
          console.warn(`Parent email not available for student: ${student.name} (${student.rollNumber})`);
          continue;
        }
        recipientEmail = student.parentEmail;
        recipientName = `Parent of ${student.name}`;
      }

      // Create HTML email content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">College Attendance System</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Message from Administration</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
            
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin-bottom: 20px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>To:</strong> ${recipientName}<br>
                ${emailType === 'PARENT' ? `<strong>Student:</strong> ${student.name} (${student.rollNumber})<br>` : ''}
                ${student.class ? `<strong>Class:</strong> ${student.class.name}<br>` : ''}
                <strong>Date:</strong> ${new Date().toLocaleDateString()}
              </p>
            </div>
            
            <div style="line-height: 1.6; color: #333; margin-bottom: 30px;">
              ${content.replace(/\n/g, '<br>')}
            </div>
            
            ${req.file ? `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin: 0; color: #1976d2; font-size: 14px;">
                  📎 <strong>Attachment:</strong> ${req.file.originalname}
                </p>
              </div>
            ` : ''}
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This is an automated message from College Attendance System.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `;

      // Send email
      const emailPromise = sendEmail(recipientEmail, subject, htmlContent)
        .then(() => {
          successfulRecipients.push({
            studentId: student.id,
            studentName: student.name,
            recipientEmail,
            recipientType: emailType
          });
        })
        .catch((error) => {
          console.error(`Failed to send email to ${recipientEmail}:`, error);
        });

      emailPromises.push(emailPromise);
    }

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    // Create message record in database
    const messageData = {
      studentId: successfulRecipients.length > 0 ? successfulRecipients[0].studentId : null,
      staffId: req.user.id,
      content,
      filePath: req.file ? req.file.path : null,
      fileName: req.file ? req.file.originalname : null,
      isAnnouncement: false,
      messageType: 'INDIVIDUAL' // Use existing enum value for compatibility
    };

    // Add email fields if they exist in the model
    try {
      if (Message.rawAttributes.emailType) {
        messageData.emailType = emailType;
      }
      if (Message.rawAttributes.emailRecipients) {
        messageData.emailRecipients = JSON.stringify(successfulRecipients);
      }
    } catch (error) {
      console.log('Email fields not available in Message model yet');
    }

    const messageRecord = await Message.create(messageData);

    res.status(201).json({
      message: `Email sent successfully to ${successfulRecipients.length} recipients!`,
      recipients: successfulRecipients.length,
      totalAttempted: students.length,
      messageId: messageRecord.id,
      emailType,
      successfulRecipients
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Get students for email selection (Super Admin only)
router.get('/students-for-email', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { classId, departmentId } = req.query;
    
    const whereCondition = {
      role: 'STUDENT',
      isActive: true
    };

    // Department filtering
    if (departmentId && departmentId !== 'ALL') {
      whereCondition.departmentId = departmentId;
    }

    if (classId && classId !== 'ALL') {
      whereCondition.classId = classId;
    }

    const students = await User.findAll({
      where: whereCondition,
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['id', 'name', 'email', 'parentEmail', 'rollNumber'],
      order: [['name', 'ASC']]
    });

    res.json(students);
  } catch (error) {
    console.error('Get students for email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Super Admin messaging with department support
router.post('/admin-send', authenticateToken, requireRole('SUPER_ADMIN'), upload.single('file'), async (req, res) => {
  try {
    const { content, messageType, classId, departmentId, recipientId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!messageType || !['all_students', 'class', 'department', 'individual', 'staff'].includes(messageType)) {
      return res.status(400).json({ error: 'Valid message type is required' });
    }

    let recipients = [];
    let messageTypeEnum = 'INDIVIDUAL';

    switch (messageType) {
      case 'all_students':
        recipients = await User.findAll({
          where: { role: 'STUDENT', isActive: true },
          attributes: ['id']
        });
        messageTypeEnum = 'ALL_STUDENTS';
        break;

      case 'department':
        if (!departmentId) {
          return res.status(400).json({ error: 'Department ID is required for department messages' });
        }
        recipients = await User.findAll({
          where: { role: 'STUDENT', isActive: true, departmentId: departmentId },
          attributes: ['id']
        });
        messageTypeEnum = 'DEPARTMENT';
        break;

      case 'class':
        if (!classId) {
          return res.status(400).json({ error: 'Class ID is required for class messages' });
        }
        recipients = await User.findAll({
          where: { role: 'STUDENT', isActive: true, classId: classId },
          attributes: ['id']
        });
        messageTypeEnum = 'CLASS';
        break;

      case 'individual':
        if (!recipientId) {
          return res.status(400).json({ error: 'Recipient ID is required for individual messages' });
        }
        const recipient = await User.findOne({
          where: { id: recipientId, role: 'STUDENT', isActive: true },
          attributes: ['id']
        });
        if (!recipient) {
          return res.status(404).json({ error: 'Recipient not found' });
        }
        recipients = [recipient];
        messageTypeEnum = 'INDIVIDUAL';
        break;

      case 'staff':
        if (departmentId && departmentId !== 'ALL') {
          recipients = await User.findAll({
            where: { role: 'STAFF', isActive: true, departmentId: departmentId },
            attributes: ['id']
          });
        } else {
          recipients = await User.findAll({
            where: { role: 'STAFF', isActive: true },
            attributes: ['id']
          });
        }
        messageTypeEnum = 'STAFF';
        break;
    }

    if (recipients.length === 0) {
      return res.status(404).json({ error: 'No recipients found' });
    }

    // Create messages for all recipients
    const messagePromises = recipients.map(recipient => {
      const messageData = {
        content,
        filePath: req.file ? req.file.path : null,
        fileName: req.file ? req.file.originalname : null,
        isAnnouncement: messageType !== 'individual',
        messageType: messageTypeEnum,
        senderId: req.user.id
      };

      // Set recipient based on message type
      if (messageType === 'staff') {
        messageData.recipientId = recipient.id;
        messageData.isStaffMessage = true;
      } else {
        messageData.studentId = recipient.id;
        messageData.staffId = req.user.id;
      }

      // Add class/department context if applicable
      if (classId) messageData.classId = classId;
      if (departmentId) messageData.departmentId = departmentId;

      return Message.create(messageData);
    });

    await Promise.all(messagePromises);

    res.status(201).json({
      message: `Message sent successfully to ${recipients.length} recipients!`,
      recipients: recipients.length,
      messageType,
      isAnnouncement: messageType !== 'individual'
    });

  } catch (error) {
    console.error('Admin send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get departments for messaging (Super Admin only)
router.get('/departments', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      attributes: ['id', 'name'],
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          where: { role: 'STUDENT', isActive: true },
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    const departmentsWithCounts = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      studentCount: dept.users ? dept.users.length : 0
    }));

    res.json(departmentsWithCounts);
  } catch (error) {
    console.error('Get departments for messaging error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get classes by department for messaging (Super Admin only)
router.get('/classes-by-department/:departmentId', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const classes = await Class.findAll({
      where: { departmentId: departmentId },
      attributes: ['id', 'name'],
      include: [
        {
          model: User,
          as: 'students',
          attributes: ['id'],
          where: { role: 'STUDENT', isActive: true },
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    const classesWithCounts = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      studentCount: cls.students ? cls.students.length : 0
    }));

    res.json(classesWithCounts);
  } catch (error) {
    console.error('Get classes by department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assigned staff for a student (Student only)
router.get('/assigned-staff', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const student = await User.findByPk(req.user.id, {
      include: [
        {
          model: Class,
          as: 'class',
          include: [
            {
              model: User,
              as: 'staff',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!student || !student.classId) {
      return res.status(404).json({ error: 'Student class not found' });
    }

    // Get all staff assigned to this student's class through StaffClass model
    const { StaffClass } = await import('../models/index.js');
    
    const assignedStaff = await StaffClass.findAll({
      where: { classId: student.classId },
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'name', 'email', 'role'],
          where: { isActive: true }
        }
      ]
    });

    // If no staff assigned through StaffClass, fall back to class staff (backward compatibility)
    let staffList = assignedStaff.map(sc => sc.staff);
    
    if (staffList.length === 0 && student.class?.staff) {
      staffList = [student.class.staff];
    }

    res.json({
      studentClass: student.class,
      assignedStaff: staffList,
      totalStaff: staffList.length
    });

  } catch (error) {
    console.error('Get assigned staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message from student to assigned staff only (Student only)
router.post('/student-to-staff', authenticateToken, requireRole('STUDENT'), upload.single('file'), async (req, res) => {
  try {
    const { staffId, content, messageType = 'question' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' });
    }

    // Verify student has class assigned
    const student = await User.findByPk(req.user.id);
    if (!student || !student.classId) {
      return res.status(400).json({ error: 'Student must be assigned to a class to send messages' });
    }

    // Verify staff is assigned to student's class
    const { StaffClass } = await import('../models/index.js');
    
    const staffAssignment = await StaffClass.findOne({
      where: {
        staffId: staffId,
        classId: student.classId
      },
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'name', 'email'],
          where: { isActive: true, role: 'STAFF' }
        }
      ]
    });

    // If not found in StaffClass, check if staff is the class staff (backward compatibility)
    let targetStaff = staffAssignment?.staff;
    
    if (!targetStaff) {
      const classStaff = await User.findOne({
        where: { 
          id: staffId,
          role: 'STAFF',
          isActive: true
        },
        include: [
          {
            model: Class,
            as: 'managedClass',
            where: { id: student.classId }
          }
        ]
      });
      targetStaff = classStaff;
    }

    if (!targetStaff) {
      return res.status(403).json({ error: 'You can only send messages to staff assigned to your class' });
    }

    // Create message record - we'll use the existing structure but add special handling
    const message = await Message.create({
      studentId: req.user.id,
      staffId: staffId,
      content: content,
      filePath: req.file ? req.file.path : null,
      fileName: req.file ? req.file.originalname : null,
      isAnnouncement: false,
      messageType: 'STUDENT_TO_STAFF', // New message type
      classId: student.classId,
      studentMessageType: messageType // question, doubt, etc.
    });

    // Get the created message with details
    const messageWithDetails = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'rollNumber']
        },
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      message: 'Message sent successfully to staff member',
      data: messageWithDetails,
      messageType: messageType
    });

  } catch (error) {
    console.error('Student to staff message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages sent by student to staff (Student only)
router.get('/sent-to-staff', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '10', 10) || 10));
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Message.findAndCountAll({
      where: { 
        studentId: req.user.id,
        messageType: 'STUDENT_TO_STAFF'
      },
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset
    });

    const totalPages = Math.ceil(count / pageSize);
    res.json({
      rows,
      count,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    });

  } catch (error) {
    console.error('Get sent to staff messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages from students for staff (Staff only)
router.get('/from-students', authenticateToken, requireRole('STAFF'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '10', 10) || 10));
    const offset = (page - 1) * pageSize;

    // Get classes assigned to this staff member
    const { StaffClass } = await import('../models/index.js');
    const staffAssignments = await StaffClass.findAll({
      where: { staffId: req.user.id },
      attributes: ['classId']
    });
    
    const classIds = staffAssignments.map(sa => sa.classId);
    
    // Also include classes where this staff is the main staff (backward compatibility)
    const managedClasses = await Class.findAll({
      where: { staffId: req.user.id },
      attributes: ['id']
    });
    
    const managedClassIds = managedClasses.map(c => c.id);
    const allClassIds = [...new Set([...classIds, ...managedClassIds])];

    if (allClassIds.length === 0) {
      return res.json({
        rows: [],
        count: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    }

    const { count, rows } = await Message.findAndCountAll({
      where: { 
        staffId: req.user.id,
        messageType: 'STUDENT_TO_STAFF',
        classId: { [Op.in]: allClassIds }
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'rollNumber']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: pageSize,
      offset
    });

    const totalPages = Math.ceil(count / pageSize);
    res.json({
      rows,
      count,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      assignedClasses: allClassIds.length
    });

  } catch (error) {
    console.error('Get messages from students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reply to student message (Staff only)
router.post('/reply-to-student', authenticateToken, requireRole('STAFF'), upload.single('file'), async (req, res) => {
  try {
    const { originalMessageId, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Reply content is required' });
    }

    if (!originalMessageId) {
      return res.status(400).json({ error: 'Original message ID is required' });
    }

    // Verify the original message exists and is sent to this staff member
    const originalMessage = await Message.findOne({
      where: {
        id: originalMessageId,
        staffId: req.user.id,
        messageType: 'STUDENT_TO_STAFF'
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'rollNumber', 'classId']
        }
      ]
    });

    if (!originalMessage) {
      return res.status(404).json({ error: 'Original message not found or you do not have permission to reply' });
    }

    // Create reply message
    const reply = await Message.create({
      studentId: originalMessage.studentId,
      staffId: req.user.id,
      content: content,
      filePath: req.file ? req.file.path : null,
      fileName: req.file ? req.file.originalname : null,
      isAnnouncement: false,
      messageType: 'STAFF_REPLY', // New message type for replies
      classId: originalMessage.classId,
      replyToMessageId: originalMessageId // Reference to original message
    });

    // Get the created reply with details
    const replyWithDetails = await Message.findByPk(reply.id, {
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'rollNumber']
        },
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      message: 'Reply sent successfully',
      data: replyWithDetails,
      originalMessageId: originalMessageId
    });

  } catch (error) {
    console.error('Reply to student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get staff by department for messaging (Super Admin only)
router.get('/staff-by-department/:departmentId', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const whereCondition = { role: 'STAFF', isActive: true };
    if (departmentId !== 'ALL') {
      whereCondition.departmentId = departmentId;
    }

    const staff = await User.findAll({
      where: whereCondition,
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(staff);
  } catch (error) {
    console.error('Get staff by department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
