import express from 'express';
import { Attendance, User, Class } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendEmail } from '../config/email.js';
import { Op } from 'sequelize';

const router = express.Router();

// Mark attendance (Staff only)
router.post('/mark', authenticateToken, requireRole('STAFF'), async (req, res) => {
  try {
    const { date, attendanceData, classId } = req.body;

    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ error: 'Date and attendance data are required' });
    }

    const results = [];

    const targetClassId = classId ? Number(classId) : null;

    for (const record of attendanceData) {
      const { studentId, status, remarks } = record;

      // Ensure student belongs to selected class (if provided) and staff's department
      const whereClause = { 
        id: studentId, 
        role: 'STUDENT', 
        isActive: true
      };
      
      if (targetClassId) {
        whereClause.classId = targetClassId;
      }
      
      const student = await User.findOne({ where: whereClause });
      if (!student) {
        return res.status(403).json({ error: `Student ${studentId} not accessible or not in your department` });
      }

      // Check if attendance already exists for this date and student
      const [attendance, created] = await Attendance.findOrCreate({
        where: { date, studentId },
        defaults: {
          status,
          staffId: req.user.id,
          remarks: remarks || null
        }
      });

      if (!created) {
        // Update existing attendance
        await attendance.update({
          status,
          staffId: req.user.id,
          remarks: remarks || null
        });
      }

      results.push({
        studentId,
        status,
        created,
        updated: !created
      });

      // Send email if student is absent
      if (status === 'ABSENT') {
        try {
          const student = await User.findByPk(studentId);
          if (student && student.parentEmail) {
            const emailHtml = `
              <h2>Attendance Alert - ${student.name}</h2>
              <p>Dear Parent,</p>
              <p>Your child <strong>${student.name}</strong> (Roll No: ${student.rollNumber}) was marked <strong>ABSENT</strong> on ${date}.</p>
              ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
              <p>If you have any concerns, please contact the school administration.</p>
              <br>
              <p>Best regards,<br>College Administration</p>
            `;

            await sendEmail(
              student.parentEmail,
              `Attendance Alert - ${student.name} - ${date}`,
              emailHtml
            );
          }
        } catch (emailError) {
          console.error('Email send error for student', studentId, ':', emailError);
        }
      }
    }

    res.json({
      message: 'Attendance marked successfully',
      results
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance for a specific date (Staff only)
router.get('/date/:date', authenticateToken, requireRole('STAFF'), async (req, res) => {
  try {
    const { date } = req.params;
    const { classId } = req.query;

    const targetClassId = classId ? Number(classId) : null;

    const attendance = await Attendance.findAll({
      where: { date },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'rollNumber', 'departmentId'],
        where: req.user.departmentId ? { departmentId: req.user.departmentId } : {}
      }],
      order: [[{ model: User, as: 'student' }, 'rollNumber', 'ASC']]
    });

    // Build where clause for students - filter by staff's department
    const studentWhereClause = { role: 'STUDENT', isActive: true };
    if (req.user.departmentId) {
      studentWhereClause.departmentId = req.user.departmentId;
    }
    if (targetClassId) {
      studentWhereClause.classId = targetClassId;
    }

    const students = await User.findAll({
      where: studentWhereClause,
      attributes: ['id', 'name', 'rollNumber'],
      order: [['rollNumber', 'ASC']]
    });

    const attendanceMap = {};
    attendance.forEach(record => {
      attendanceMap[record.studentId] = record;
    });

    const result = students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      status: attendanceMap[student.id]?.status || null,
      remarks: attendanceMap[student.id]?.remarks || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's own attendance (Student only)
router.get('/my-attendance', authenticateToken, requireRole('STUDENT'), async (req, res) => {
  try {
    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    const offset = (page - 1) * pageSize;

    // Get total count for summary
    const totalRecords = await Attendance.count({
      where: { studentId: req.user.id }
    });

    // Get paginated attendance records
    const attendance = await Attendance.findAll({
      where: { studentId: req.user.id },
      include: [{
        model: User,
        as: 'staff',
        attributes: ['name']
      }],
      order: [['date', 'DESC']],
      limit: pageSize,
      offset: offset
    });

    // Calculate summary from all records (not just current page)
    const allAttendanceForSummary = await Attendance.findAll({
      where: { studentId: req.user.id },
      attributes: ['status']
    });

    const totalDays = allAttendanceForSummary.length;
    const presentDays = allAttendanceForSummary.filter(record => record.status === 'PRESENT').length;
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.json({
      attendance,
      summary: {
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        percentage: parseFloat(percentage)
      },
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
        hasNext: page < Math.ceil(totalRecords / pageSize),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance report for all students (Staff only)
router.get('/report', authenticateToken, requireRole('STAFF'), async (req, res) => {
  try {
    const { startDate, endDate, classId } = req.query;
    const targetClassId = classId ? Number(classId) : null;

    const whereClause = {};
    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    }

    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'rollNumber', 'classId', 'departmentId'],
        where: req.user.role === 'STAFF' && req.user.departmentId ? 
          { departmentId: req.user.departmentId } : {}
      }],
      order: [
        [{ model: User, as: 'student' }, 'rollNumber', 'ASC'],
        ['date', 'DESC']
      ]
    });

    // Filter to students in selected class (if provided)
    const filtered = attendance.filter(record => record.student && (!targetClassId || record.student.classId === targetClassId));

    // Group by student
    const studentAttendance = {};
    filtered.forEach(record => {
      if (!studentAttendance[record.studentId]) {
        studentAttendance[record.studentId] = {
          student: record.student,
          records: [],
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          percentage: 0
        };
      }

      studentAttendance[record.studentId].records.push(record);
      studentAttendance[record.studentId].totalDays++;

      if (record.status === 'PRESENT') {
        studentAttendance[record.studentId].presentDays++;
      } else {
        studentAttendance[record.studentId].absentDays++;
      }
    });

    // Calculate percentages
    Object.values(studentAttendance).forEach((student) => {
      if (student.totalDays > 0) {
        student.percentage = ((student.presentDays / student.totalDays) * 100).toFixed(2);
      }
    });

    res.json(Object.values(studentAttendance));
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance stats for a class over the last N days
// Used by StaffDashboard to display class attendanceRate and lastActivity
router.get('/stats/:classId', authenticateToken, requireRole('STAFF', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const classId = Number(req.params.classId);
    const days = Math.max(1, Math.min(60, Number(req.query.days) || 7));

    if (Number.isNaN(classId)) {
      return res.status(400).json({ error: 'Invalid classId' });
    }

    // Determine date range
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    // Fetch students in the class (with department filtering for staff)
    const studentWhereClause = { role: 'STUDENT', isActive: true, classId };
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      studentWhereClause.departmentId = req.user.departmentId;
    }
    
    const students = await User.findAll({
      where: studentWhereClause,
      attributes: ['id']
    });

    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return res.json({ attendanceRate: 0, lastActivity: null, totalMarked: 0 });
    }

    // Fetch attendance records in date range for students in class
    const records = await Attendance.findAll({
      where: {
        date: { [Op.between]: [startDate, endDate] },
        studentId: studentIds
      },
      order: [['date', 'DESC']]
    });

    const totalMarked = records.length;
    const presentCount = records.filter(r => r.status === 'PRESENT').length;
    const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;
    const lastActivity = records.length > 0 ? records[0].date : null;

    res.json({ attendanceRate, lastActivity, totalMarked });
  } catch (error) {
    console.error('Get class stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
