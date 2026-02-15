import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User, Message, Department } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Test route to check database connection and Message model
router.get('/test', authenticateToken, async (req, res) => {
  try {
    console.log('Testing Message model...');

    // Check table structure
    const tableInfo = await Message.describe();
    console.log('Message table structure:', tableInfo);

    const testMessage = {
      content: 'Test message',
      senderId: req.user.id,
      recipientId: req.user.id,
      messageType: 'STAFF_TO_ADMIN',
      isRead: false,
      isStaffMessage: true
    };
    console.log('Test message data:', testMessage);

    // Just test the model without creating
    const result = await Message.build(testMessage);
    console.log('Model build successful:', result.toJSON());

    res.json({
      success: true,
      message: 'Message model test passed',
      testData: result.toJSON(),
      tableStructure: tableInfo
    });
  } catch (error) {
    console.error('Message model test failed:', error);
    res.status(500).json({
      error: 'Message model test failed',
      details: error.message
    });
  }
});

// Configure multer for staff message uploads (mirror messages.js)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Send message from staff to super admin or vice versa
router.post('/send', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { content, recipientId } = req.body;
    const senderId = req.user.id;

    console.log('Staff message request:', { content, recipientId, senderId, hasFile: !!req.file });

    // Validate input
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    // Validate sender and recipient exist and have proper roles
    const sender = await User.findByPk(senderId);
    const recipient = await User.findByPk(recipientId);

    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    console.log('Sender role:', sender.role, 'Recipient role:', recipient.role);

    // Validate role-based messaging
    if (sender.role === 'STAFF' && recipient.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Staff can only send messages to Super Admin' });
    }

    if (sender.role === 'SUPER_ADMIN' && recipient.role !== 'STAFF') {
      return res.status(403).json({ error: 'Super Admin can only send messages to Staff' });
    }

    if (sender.role !== 'STAFF' && sender.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Staff and Super Admin can use this messaging system' });
    }

    // Create a simple staff message using existing fields
    console.log('Creating staff message using compatible approach...');

    let message;
    try {
      // Use existing message structure with staff info in content
      const staffMessageData = {
        content: `[STAFF MESSAGE] From: ${sender.name} (${sender.email}) To: ${recipient.name} (${recipient.email})\n\n${content.trim()}`,
        isRead: false,
        messageType: 'INDIVIDUAL', // Use existing enum value
        isAnnouncement: false,
        // Use existing fields creatively
        staffId: parseInt(senderId), // Store sender in staffId
        studentId: parseInt(recipientId), // Store recipient in studentId temporarily
      };

      // Add file info if exists
      if (req.file) {
        staffMessageData.filePath = req.file.path;
        staffMessageData.fileName = req.file.originalname;
      }

      console.log('Creating staff message with compatible data:', staffMessageData);
      message = await Message.create(staffMessageData, { validate: false });
      console.log('Staff message created successfully:', message.id);

    } catch (createError) {
      console.error('Staff message creation failed:', createError);
      console.error('Error details:', createError.message);

      // Return a more specific error
      return res.status(500).json({
        error: 'Failed to create staff message',
        details: createError.message,
        hint: 'Database table may need updating. Check server logs.'
      });
    }

    // Return success response with basic info
    res.status(201).json({
      message: 'Staff message sent successfully',
      data: {
        id: message.id,
        content: content.trim(),
        sender: {
          id: sender.id,
          name: sender.name,
          email: sender.email,
          role: sender.role
        },
        recipient: {
          id: recipient.id,
          name: recipient.name,
          email: recipient.email,
          role: recipient.role
        },
        fileName: req.file ? req.file.originalname : null,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send staff message error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get messages between staff and super admin
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || (user.role !== 'STAFF' && user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Query for staff messages using both new and fallback approaches
    let whereCondition;
    if (user.role === 'STAFF') {
      // Staff can see messages where they are involved
      whereCondition = {
        [Op.or]: [
          // New approach with senderId/recipientId
          { senderId: userId, messageType: 'STAFF_TO_ADMIN' },
          { recipientId: userId, messageType: 'ADMIN_TO_STAFF' },
          // Fallback approach using staffId/studentId
          { staffId: userId, content: { [Op.like]: '%[STAFF MESSAGE]%' } },
          { studentId: userId, content: { [Op.like]: '%[STAFF MESSAGE]%' } }
        ]
      };
    } else {
      // Super admin can see all staff messages
      whereCondition = {
        [Op.or]: [
          { isStaffMessage: true },
          { content: { [Op.like]: '%[STAFF MESSAGE]%' } }
        ]
      };
    }

    console.log('Querying staff messages with condition:', JSON.stringify(whereCondition, null, 2));

    const messages = await Message.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        },
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    console.log(`Found ${messages.length} staff messages`);

    // Transform messages to include sender/recipient info
    const transformedMessages = messages.map(msg => {
      const messageData = msg.toJSON();

      // Extract sender/recipient from content if using fallback approach
      if (messageData.content && messageData.content.includes('[STAFF MESSAGE]')) {
        const contentMatch = messageData.content.match(/From: (.+?) \((.+?)\) To: (.+?) \((.+?)\)/);
        if (contentMatch) {
          messageData.sender = {
            name: contentMatch[1],
            email: contentMatch[2]
          };
          messageData.recipient = {
            name: contentMatch[3],
            email: contentMatch[4]
          };
          // Determine message type based on roles
          messageData.messageType = messageData.staffId === userId ? 'STAFF_TO_ADMIN' : 'ADMIN_TO_STAFF';
        }
      }

      return messageData;
    });

    res.json({
      messages: transformedMessages,
      userRole: user.role
    });
  } catch (error) {
    console.error('Get staff conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark message as read
router.patch('/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: {
        id: messageId,
        recipientId: userId,
        isStaffMessage: true
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

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || (user.role !== 'STAFF' && user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const unreadCount = await Message.count({
      where: {
        recipientId: userId,
        isRead: false,
        isStaffMessage: true
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all staff users (for super admin to select recipients)
router.get('/staff-list', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { departmentId } = req.query;

    const whereCondition = {
      role: 'STAFF',
      isActive: true
    };

    // Department filtering
    if (departmentId && departmentId !== 'ALL') {
      whereCondition.departmentId = departmentId;
    }

    const staffUsers = await User.findAll({
      where: whereCondition,
      attributes: ['id', 'name', 'email', 'role', 'departmentId'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ staff: staffUsers });
  } catch (error) {
    console.error('Get staff list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get super admin users (for staff to select recipients)
router.get('/admin-list', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'STAFF') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const adminUsers = await User.findAll({
      where: {
        role: 'SUPER_ADMIN',
        isActive: true
      },
      attributes: ['id', 'name', 'email', 'role'],
      order: [['name', 'ASC']]
    });

    res.json({ admins: adminUsers });
  } catch (error) {
    console.error('Get admin list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download attachment for a staff message (allowed for sender or recipient)
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await Message.findByPk(messageId);
    if (!message || !message.isStaffMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Authorization: only sender or recipient can download
    if (message.senderId !== userId && message.recipientId !== userId && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!message.filePath) {
      return res.status(404).json({ error: 'File not attached' });
    }

    const filePath = path.resolve(message.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    return res.download(filePath, message.fileName || 'attachment');
  } catch (error) {
    console.error('Download staff message file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
