import express from 'express';
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import { Attendance, Message, User, Class, LoginLog, Department } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Utility: get date string YYYY-MM-DD
const toDateStr = (d) => d.toISOString().split('T')[0];

// GET /analytics/attendance-trends?days=30
// SUPER_ADMIN: across all students; STAFF: limited to their managed class if exists, else across all their students
router.get('/attendance-trends', authenticateToken, requireRole('SUPER_ADMIN', 'STAFF'), async (req, res) => {
  try {
    console.log('🔍 Analytics: attendance-trends called by user:', req.user.role, req.user.id);
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    console.log('📅 Date range:', toDateStr(start), 'to', toDateStr(end));

    // Build where clause
    const where = {
      date: { [Op.between]: [toDateStr(start), toDateStr(end)] }
    };

    // Department filtering
    if (req.query.departmentId && req.query.departmentId !== 'ALL') {
      const deptId = Number(req.query.departmentId);
      if (!Number.isNaN(deptId)) {
        const students = await User.findAll({ 
          where: { role: 'STUDENT', isActive: true, departmentId: deptId }, 
          attributes: ['id'] 
        });
        const ids = students.map(s => s.id);
        if (ids.length === 0) return res.json([]);
        where.studentId = { [Op.in]: ids };
      }
    }

    // Scope for staff: only students they can manage (by department)
    if (req.user.role === 'STAFF') {
      // Staff can only see students in their department
      if (req.user.departmentId) {
        const students = await User.findAll({ 
          where: { role: 'STUDENT', isActive: true, departmentId: req.user.departmentId }, 
          attributes: ['id'] 
        });
        const ids = students.map(s => s.id);
        console.log('👥 Students in staff department:', ids.length, 'students');
        if (ids.length === 0) return res.json([]);
        where.studentId = { [Op.in]: ids };
      }
    }

    console.log('🔍 Attendance query where clause:', JSON.stringify(where, null, 2));

    const records = await Attendance.findAll({
      where,
      attributes: ['date', 'status', 'studentId'],
      order: [['date', 'ASC']]
    });

    console.log('📊 Found attendance records:', records.length);

    // Group by date
    const map = new Map();
    records.forEach(r => {
      const key = r.date;
      if (!map.has(key)) map.set(key, { date: key, present: 0, absent: 0, total: 0 });
      const item = map.get(key);
      if (r.status === 'PRESENT') item.present++;
      else if (r.status === 'ABSENT') item.absent++;
      item.total++;
    });

    // Ensure all dates are present in range
    const result = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = toDateStr(d);
      const item = map.get(key) || { date: key, present: 0, absent: 0, total: 0 };
      const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
      result.push({ date: key, rate, total: item.total });
    }

    console.log('📈 Final result being sent:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error('analytics/attendance-trends error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/department-performance?days=30
// Returns per-department studentCount and attendanceRate for range
router.get('/department-performance', authenticateToken, requireRole('SUPER_ADMIN', 'STAFF'), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    let whereClause = {};
    
    // Department filtering
    if (req.query.departmentId && req.query.departmentId !== 'ALL') {
      const deptId = Number(req.query.departmentId);
      if (!Number.isNaN(deptId)) {
        whereClause.id = deptId;
      }
    }

    // Staff scope: only their department
    if (req.user.role === 'STAFF') {
      if (req.user.departmentId) {
        whereClause.id = req.user.departmentId;
      }
    }

    let departments = await Department.findAll({ 
      where: whereClause,
      attributes: ['id', 'name', 'description', 'headId'],
      include: [
        {
          model: User,
          as: 'head',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ]
    });

    const results = [];

    for (const dept of departments) {
      // Get all students in this department
      const students = await User.findAll({ 
        where: { role: 'STUDENT', isActive: true, departmentId: dept.id }, 
        attributes: ['id'] 
      });
      const studentIds = students.map(s => s.id);
      
      // Get all classes in this department
      const classCount = await Class.count({ where: { departmentId: dept.id } });
      
      // Get all staff in this department
      const staffCount = await User.count({ 
        where: { role: 'STAFF', isActive: true, departmentId: dept.id } 
      });

      let attendanceRate = 0;
      if (studentIds.length > 0) {
        const att = await Attendance.findAll({
          where: {
            studentId: { [Op.in]: studentIds },
            date: { [Op.between]: [toDateStr(start), toDateStr(end)] }
          },
          attributes: ['status']
        });
        const total = att.length;
        const present = att.filter(a => a.status === 'PRESENT').length;
        attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      }

      // Get department messages count (messages from users in this department)
      let messagesCount = 0;
      if (studentIds.length > 0) {
        const staffIds = await User.findAll({ 
          where: { role: 'STAFF', isActive: true, departmentId: dept.id }, 
          attributes: ['id'] 
        }).then(staff => staff.map(s => s.id));
        
        const allUserIds = [...studentIds, ...staffIds];
        messagesCount = await Message.count({
          where: {
            [Op.or]: [
              { studentId: { [Op.in]: allUserIds } },
              { staffId: { [Op.in]: allUserIds } },
              { senderId: { [Op.in]: allUserIds } },
              { recipientId: { [Op.in]: allUserIds } }
            ],
            createdAt: { [Op.between]: [start, end] }
          }
        });
      }

      results.push({ 
        departmentName: dept.name,
        departmentId: dept.id,
        studentCount: studentIds.length,
        staffCount,
        classCount,
        attendanceRate, 
        messagesCount,
        headName: dept.head?.name || 'Not assigned'
      });
    }

    res.json(results);
  } catch (error) {
    console.error('analytics/department-performance error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Backward compatibility: redirect class-performance to department-performance
router.get('/class-performance', authenticateToken, requireRole('SUPER_ADMIN', 'STAFF'), async (req, res) => {
  // Redirect to department-performance with same query parameters
  const queryString = new URLSearchParams(req.query).toString();
  const redirectUrl = `/api/analytics/department-performance${queryString ? '?' + queryString : ''}`;
  res.redirect(redirectUrl);
});

// GET /analytics/staff-activity?days=30 (SUPER_ADMIN)
router.get('/staff-activity', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const whereClause = { role: 'STAFF', isActive: true };
    
    // Department filtering
    if (req.query.departmentId && req.query.departmentId !== 'ALL') {
      const deptId = Number(req.query.departmentId);
      if (!Number.isNaN(deptId)) {
        whereClause.departmentId = deptId;
      }
    }

    const staff = await User.findAll({ 
      where: whereClause, 
      attributes: ['id', 'name', 'departmentId'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    const results = [];
    for (const s of staff) {
      const classesManaged = await Class.count({ where: { staffId: s.id } });
      const messagesCount = await Message.count({ where: { staffId: s.id, createdAt: { [Op.between]: [start, end] } } });
      const lastMessage = await Message.findOne({ where: { staffId: s.id }, order: [['createdAt', 'DESC']], attributes: ['createdAt'] });
      results.push({ 
        staffName: s.name, 
        departmentName: s.department?.name || 'No Department',
        classesManaged, 
        messagesCount, 
        lastActive: lastMessage?.createdAt || null 
      });
    }

    res.json(results);
  } catch (error) {
    console.error('analytics/staff-activity error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/system-activity?days=7 (SUPER_ADMIN)
// Track real logins, messages, and attendance records
router.get('/system-activity', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(30, Number(req.query.days) || 7));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    // Build daily series
    const map = new Map();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map.set(toDateStr(d), { date: toDateStr(d), logins: 0, messages: 0, attendanceRecords: 0 });
    }

    // Get real login data from LoginLog
    const loginLogs = await LoginLog.findAll({ 
      where: { 
        loginTime: { [Op.between]: [start, end] },
        success: true // Only count successful logins
      }, 
      attributes: ['loginTime'] 
    });
    loginLogs.forEach(log => {
      const key = toDateStr(new Date(log.loginTime));
      const item = map.get(key);
      if (item) item.logins++;
    });

    const messages = await Message.findAll({ where: { createdAt: { [Op.between]: [start, end] } }, attributes: ['createdAt'] });
    messages.forEach(m => {
      const key = toDateStr(new Date(m.createdAt));
      const item = map.get(key);
      if (item) item.messages++;
    });

    const attendance = await Attendance.findAll({ where: { date: { [Op.between]: [toDateStr(start), toDateStr(end)] } }, attributes: ['date'] });
    attendance.forEach(a => {
      const item = map.get(a.date);
      if (item) item.attendanceRecords++;
    });

    res.json(Array.from(map.values()));
  } catch (error) {
    console.error('analytics/system-activity error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/login-stats?days=30 (SUPER_ADMIN)
// Get detailed login statistics
router.get('/login-stats', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const baseWhere = { loginTime: { [Op.between]: [start, end] } };

    // Simple totals
    const [totalLogins, failedLogins] = await Promise.all([
      LoginLog.count({ where: { ...baseWhere, success: true } }),
      LoginLog.count({ where: { ...baseWhere, success: false } })
    ]);

    // Unique users (DB-agnostic)
    const uniqueUserRows = await LoginLog.findAll({
      where: { ...baseWhere, success: true },
      attributes: ['userId'],
      group: ['userId'],
      raw: true
    });
    const uniqueUsers = uniqueUserRows.length;

    // Role stats: fetch distinct userIds that logged in, then fetch their roles
    const loginUserIds = uniqueUserRows.map(r => r.userId);
    let roleStats = {};
    if (loginUserIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: loginUserIds } },
        attributes: ['id', 'role'],
        raw: true
      });
      roleStats = users.reduce((acc, u) => {
        const role = u.role || 'UNKNOWN';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});
    }

    // Top users: aggregate in JS for compatibility
    const successLogs = await LoginLog.findAll({
      where: { ...baseWhere, success: true },
      attributes: ['userId'],
      raw: true
    });
    const counts = successLogs.reduce((acc, r) => {
      acc[r.userId] = (acc[r.userId] || 0) + 1;
      return acc;
    }, {});
    const topUserIds = Object.entries(counts)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 10)
      .map(([userId]) => Number(userId));

    const topUsersRaw = topUserIds.length
      ? await User.findAll({
          where: { id: { [Op.in]: topUserIds } },
          attributes: ['id', 'name', 'email', 'role'],
          raw: true
        })
      : [];

    const topUsers = topUserIds.map(id => ({
      user: topUsersRaw.find(u => u.id === id) || { id, name: 'Unknown', email: '', role: 'UNKNOWN' },
      loginCount: counts[id] || 0
    }));

    res.json({ totalLogins, failedLogins, uniqueUsers, roleStats, topUsers });
  } catch (error) {
    console.error('analytics/login-stats error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /analytics/department-comparison (SUPER_ADMIN)
// Compare departments side by side
router.get('/department-comparison', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    const comparison = [];

    for (const dept of departments) {
      // Get counts
      const [studentCount, staffCount, classCount] = await Promise.all([
        User.count({ where: { departmentId: dept.id, role: 'STUDENT', isActive: true } }),
        User.count({ where: { departmentId: dept.id, role: 'STAFF', isActive: true } }),
        Class.count({ where: { departmentId: dept.id } })
      ]);

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const students = await User.findAll({
        where: { departmentId: dept.id, role: 'STUDENT', isActive: true },
        attributes: ['id']
      });
      const studentIds = students.map(s => s.id);

      let recentAttendanceRate = 0;
      if (studentIds.length > 0) {
        const recentAttendance = await Attendance.findAll({
          where: {
            studentId: { [Op.in]: studentIds },
            date: { [Op.gte]: toDateStr(sevenDaysAgo) }
          },
          attributes: ['status']
        });
        
        const total = recentAttendance.length;
        const present = recentAttendance.filter(a => a.status === 'PRESENT').length;
        recentAttendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      }

      const recentMessages = await Message.count({
        where: {
          createdAt: { [Op.gte]: sevenDaysAgo },
          studentId: { [Op.in]: studentIds }
        }
      });

      comparison.push({
        departmentId: dept.id,
        departmentName: dept.name,
        studentCount,
        staffCount,
        classCount,
        recentAttendanceRate,
        recentMessages,
        efficiency: studentCount > 0 ? Math.round((recentAttendanceRate + (recentMessages / studentCount * 10)) / 2) : 0
      });
    }

    res.json(comparison);
  } catch (error) {
    console.error('analytics/department-comparison error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /analytics/department-trends?departmentId=1&days=30 (SUPER_ADMIN)
// Get detailed trends for a specific department
router.get('/department-trends', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const departmentId = Number(req.query.departmentId);
    if (!departmentId || Number.isNaN(departmentId)) {
      return res.status(400).json({ error: 'Valid department ID is required' });
    }

    const days = Math.max(1, Math.min(90, Number(req.query.days) || 30));
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    // Verify department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get students in department
    const students = await User.findAll({
      where: { departmentId: departmentId, role: 'STUDENT', isActive: true },
      attributes: ['id']
    });
    const studentIds = students.map(s => s.id);

    // Build daily trends
    const trends = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = toDateStr(d);
      
      // Attendance for this day
      let attendanceRate = 0;
      if (studentIds.length > 0) {
        const dayAttendance = await Attendance.findAll({
          where: {
            studentId: { [Op.in]: studentIds },
            date: dateStr
          },
          attributes: ['status']
        });
        
        const total = dayAttendance.length;
        const present = dayAttendance.filter(a => a.status === 'PRESENT').length;
        attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
      }

      // Messages for this day
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const messageCount = await Message.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] },
          studentId: { [Op.in]: studentIds }
        }
      });

      trends.push({
        date: dateStr,
        attendanceRate,
        messageCount,
        activeStudents: studentIds.length
      });
    }

    res.json({
      department: {
        id: department.id,
        name: department.name
      },
      trends,
      summary: {
        totalStudents: studentIds.length,
        avgAttendanceRate: trends.length > 0 ? Math.round(trends.reduce((sum, t) => sum + t.attendanceRate, 0) / trends.length) : 0,
        totalMessages: trends.reduce((sum, t) => sum + t.messageCount, 0)
      }
    });
  } catch (error) {
    console.error('analytics/department-trends error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
