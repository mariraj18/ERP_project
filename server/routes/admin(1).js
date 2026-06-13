import express from 'express';
import { User, Message, Attendance, Class } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// Get recent activities for Super Admin dashboard
router.get('/recent-activities', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = [];

    // Get recent messages sent by Super Admin
    const recentMessages = await Message.findAll({
      where: { 
        staffId: req.user.id,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Add message activities
    recentMessages.forEach(message => {
      let activityType = 'message_sent';
      let description = '';
      
      if (message.messageType === 'ALL_STUDENTS' || message.isAnnouncement) {
        activityType = 'announcement_sent';
        description = `Sent announcement to all students: "${message.content.substring(0, 50)}..."`;
      } else if (message.messageType === 'CLASS') {
        activityType = 'class_message_sent';
        description = `Sent message to ${message.class?.name || 'class'}: "${message.content.substring(0, 50)}..."`;
      } else {
        description = `Sent personal message: "${message.content.substring(0, 50)}..."`;
      }

      activities.push({
        id: `message_${message.id}`,
        type: activityType,
        description,
        timestamp: message.createdAt,
        icon: message.messageType === 'ALL_STUDENTS' || message.isAnnouncement ? 'bell' : 
              message.messageType === 'CLASS' ? 'users' : 'message-square',
        color: message.messageType === 'ALL_STUDENTS' || message.isAnnouncement ? 'red' : 
               message.messageType === 'CLASS' ? 'blue' : 'green'
      });
    });

    // Get recent user registrations
    const recentUsers = await User.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Add user registration activities
    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_registered',
        description: `New ${user.role.toLowerCase()} registered: ${user.name}`,
        timestamp: user.createdAt,
        icon: user.role === 'STUDENT' ? 'graduation-cap' : 'user-check',
        color: user.role === 'STUDENT' ? 'blue' : 'green'
      });
    });

    // Get recent attendance records (last 3 days)
    const recentAttendance = await Attendance.findAll({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Last 3 days
        }
      },
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 3
    });

    // Add attendance activities
    recentAttendance.forEach(attendance => {
      activities.push({
        id: `attendance_${attendance.id}`,
        type: 'attendance_taken',
        description: `Attendance taken by ${attendance.staff?.name || 'staff'} for ${attendance.date}`,
        timestamp: attendance.createdAt,
        icon: 'calendar',
        color: 'purple'
      });
    });

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json(sortedActivities);
  } catch (error) {
    console.error('Failed to load recent activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard statistics
router.get('/dashboard-stats', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const [
      totalStudents,
      totalStaff,
      totalClasses,
      messagesThisWeek,
      attendanceToday
    ] = await Promise.all([
      User.count({ where: { role: 'STUDENT', isActive: true } }),
      User.count({ where: { role: 'STAFF', isActive: true } }),
      Class.count(),
      Message.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      Attendance.count({
        where: {
          date: new Date().toISOString().split('T')[0]
        }
      })
    ]);

    // Calculate top performing class based on attendance rate (last 30 days)
    let topPerformingClass = 'N/A';
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const classes = await Class.findAll({
        attributes: ['id', 'name'],
        include: [{
          model: User,
          as: 'students',
          attributes: ['id'],
          where: { role: 'STUDENT', isActive: true },
          required: false
        }]
      });

      let bestClass = null;
      let highestRate = -1;

      for (const cls of classes) {
        if (cls.students && cls.students.length > 0) {
          const studentIds = cls.students.map(s => s.id);
          
          const attendanceRecords = await Attendance.findAll({
            where: {
              studentId: { [Op.in]: studentIds },
              date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] }
            },
            attributes: ['status']
          });

          const totalRecords = attendanceRecords.length;
          const presentRecords = attendanceRecords.filter(r => r.status === 'PRESENT').length;
          const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

          if (attendanceRate > highestRate && totalRecords >= 5) { // At least 5 attendance records
            highestRate = attendanceRate;
            bestClass = cls.name;
          }
        }
      }

      topPerformingClass = bestClass || 'N/A';
    } catch (classError) {
      console.error('Error calculating top performing class:', classError);
    }

    // Calculate overall attendance rate for the last 7 days
    let attendanceRate = 85; // default
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentAttendance = await Attendance.findAll({
        where: {
          date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] }
        },
        attributes: ['status']
      });

      if (recentAttendance.length > 0) {
        const presentCount = recentAttendance.filter(r => r.status === 'PRESENT').length;
        attendanceRate = Math.round((presentCount / recentAttendance.length) * 100);
      }
    } catch (attendanceError) {
      console.error('Error calculating attendance rate:', attendanceError);
    }

    // Calculate classes with low attendance (less than 75%)
    let classesWithLowAttendance = 0;
    try {
      const classes = await Class.findAll({
        include: [{
          model: User,
          as: 'students',
          attributes: ['id'],
          where: { role: 'STUDENT', isActive: true },
          required: false
        }]
      });

      for (const cls of classes) {
        if (cls.students && cls.students.length > 0) {
          const studentIds = cls.students.map(s => s.id);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const attendanceRecords = await Attendance.findAll({
            where: {
              studentId: { [Op.in]: studentIds },
              date: { [Op.gte]: sevenDaysAgo.toISOString().split('T')[0] }
            },
            attributes: ['status']
          });

          const totalRecords = attendanceRecords.length;
          const presentRecords = attendanceRecords.filter(r => r.status === 'PRESENT').length;
          const classAttendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 100;

          if (classAttendanceRate < 75 && totalRecords >= 3) { // At least 3 records
            classesWithLowAttendance++;
          }
        }
      }
    } catch (lowAttendanceError) {
      console.error('Error calculating low attendance classes:', lowAttendanceError);
    }

    res.json({
      totalStudents,
      totalStaff,
      totalClasses,
      messagesThisWeek,
      attendanceToday,
      activeStudents: totalStudents, // Assuming all are active
      activeStaff: totalStaff,
      newRegistrations: 0, // Can be calculated if needed
      attendanceRate,
      averageLogin: 0, // Would need login tracking
      classesWithLowAttendance,
      topPerformingClass
    });
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
