import express from 'express';
import jwt from 'jsonwebtoken';
import { User, Class, LoginLog } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login Route - FIXED VERSION
router.post('/login', async (req, res) => {
  console.log('🔐 LOGIN REQUEST RECEIVED');
  
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    console.log('📧 Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    console.log('🔍 Searching for user in database...');
    const user = await User.findOne({ 
      where: { 
        email: email.trim().toLowerCase(), 
        isActive: true 
      }
    });

    if (!user) {
      console.log('❌ User not found or inactive:', email);
      // Log failed attempt WITHOUT userId (since user doesn't exist)
      try {
        await LoginLog.create({
          userId: null, // Explicitly set to null for non-existent users
          loginTime: new Date(),
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'User not found'
        });
      } catch (logError) {
        console.error('⚠️ Failed to create login log (non-critical):', logError.message);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', { id: user.id, name: user.name, role: user.role });

    // Validate password
    console.log('🔐 Validating password...');
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', user.email);
      // Log failed attempt WITH userId
      try {
        await LoginLog.create({
          userId: user.id, // Use the actual user ID
          loginTime: new Date(),
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'Invalid password'
        });
      } catch (logError) {
        console.error('⚠️ Failed to create login log (non-critical):', logError.message);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password validated successfully');

    // Update user login info
    console.log('📝 Updating user login info...');
    await user.update({
      lastLogin: new Date(),
      loginCount: (user.loginCount || 0) + 1
    });

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role,
        email: user.email,
        departmentId: user.departmentId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Token generated successfully');

    // Get class information
    console.log('🏫 Fetching class information...');
    let classInfo = null;
    let managedClass = null;

    try {
      if (user.role === 'STUDENT' && user.classId) {
        console.log('📚 Fetching student class...');
        const studentClass = await Class.findByPk(user.classId);
        if (studentClass) {
          classInfo = { id: studentClass.id, name: studentClass.name };
          console.log('✅ Student class found:', classInfo);
        }
      }

      if (user.role === 'STAFF') {
        console.log('👨‍🏫 Fetching staff managed class...');
        const staffClass = await Class.findOne({ 
          where: { staffId: user.id } 
        });
        if (staffClass) {
          managedClass = { id: staffClass.id, name: staffClass.name };
          console.log('✅ Staff managed class found:', managedClass);
        } else {
          console.log('ℹ️ No managed class found for staff - this is normal');
          managedClass = null;
        }
      }
    } catch (classError) {
      console.error('⚠️ Error fetching class info (non-critical):', classError.message);
      // Continue without class info - don't fail login
      classInfo = null;
      managedClass = null;
    }

    // Log successful login (WITH userId)
    console.log('📊 Creating success log...');
    try {
      await LoginLog.create({
        userId: user.id, // Use the actual user ID
        loginTime: new Date(),
        ipAddress,
        userAgent,
        success: true,
        failureReason: null
      });
    } catch (logError) {
      console.error('⚠️ Failed to create success login log (non-critical):', logError.message);
      // Continue even if log fails
    }

    // Prepare response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber || null,
      class: classInfo,
      managedClass: managedClass,
      departmentId: user.departmentId
    };

    console.log('✅ Login successful for:', user.email);
    console.log('📤 Sending response with user data');

    // Send success response
    res.json({
      token,
      user: userResponse
    });

    console.log('🎉 LOGIN PROCESS COMPLETED SUCCESSFULLY');

  } catch (error) {
    console.error('💥 LOGIN ERROR:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Send appropriate error response
    if (error.name === 'JsonWebTokenError') {
      return res.status(500).json({ error: 'Token generation failed' });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ error: 'Database error occurred' });
    }

    res.status(500).json({ 
      error: 'Login failed due to server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let classInfo = null;
    let managedClass = null;

    try {
      if (req.user.role === 'STUDENT' && req.user.classId) {
        const cls = await Class.findByPk(req.user.classId);
        if (cls) classInfo = { id: cls.id, name: cls.name };
      }
      
      if (req.user.role === 'STAFF') {
        const cls = await Class.findOne({ where: { staffId: req.user.id } });
        if (cls) managedClass = { id: cls.id, name: cls.name };
      }
    } catch (classError) {
      console.error('Error fetching class info in /me:', classError);
      // Continue without class info
    }

    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNumber: req.user.rollNumber,
      class: classInfo,
      managedClass: managedClass,
      departmentId: req.user.departmentId
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await user.update({ passwordHash: newPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;