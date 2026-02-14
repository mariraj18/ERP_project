import express from 'express';
import { User, Class, Department, StaffClass } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

const router = express.Router();

// ======================= STUDENTS ======================= //

// Get students
// SUPER_ADMIN: all students
// STAFF: only students in their department
router.get('/students', authenticateToken, requireRole('SUPER_ADMIN', 'STAFF'), async (req, res) => {
  try {
    // Pagination and search
    const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '25', 10) || 25));
    const q = (req.query.q || '').toString().trim();

    const whereClause = { role: 'STUDENT', isActive: true };

    // STAFF: Filter by their department only
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      whereClause.departmentId = req.user.departmentId;
    } else if (req.user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN: Can filter by any department or see all
      if (req.query.departmentId) {
        const deptId = Number(req.query.departmentId);
        if (!Number.isNaN(deptId)) {
          whereClause.departmentId = deptId;
        }
      }
    }

    // Optional filter by classId (applies to any role)
    if (req.query.classId) {
      const cid = Number(req.query.classId);
      if (!Number.isNaN(cid)) {
        whereClause.classId = cid;
      }
    }

    // Search by name, rollNumber, or email
    if (q) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { rollNumber: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const offset = (page - 1) * pageSize;

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'rollNumber', 'parentEmail', 'classId'],
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ],
      order: [[q ? 'name' : 'rollNumber', 'ASC']],
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
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create student (Super Admin only)
router.post('/students', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, email, rollNumber, parentEmail, password, classId, departmentId } = req.body;

    if (!name || !email || !rollNumber || !parentEmail || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // If classId is provided, get the department from the class
    let finalDepartmentId = departmentId;
    if (classId && !departmentId) {
      const classInfo = await Class.findByPk(classId, { attributes: ['departmentId'] });
      if (classInfo) {
        finalDepartmentId = classInfo.departmentId;
      }
    }

    const student = await User.create({
      name,
      email,
      rollNumber,
      parentEmail,
      passwordHash: password,
      role: 'STUDENT',
      classId: classId || null,
      departmentId: finalDepartmentId || null
    });

    // Fetch the created student with relations
    const createdStudent = await User.findByPk(student.id, {
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({
      id: createdStudent.id,
      name: createdStudent.name,
      email: createdStudent.email,
      rollNumber: createdStudent.rollNumber,
      parentEmail: createdStudent.parentEmail,
      classId: createdStudent.classId,
      departmentId: createdStudent.departmentId,
      class: createdStudent.class,
      department: createdStudent.department
    });
  } catch (error) {
    console.error('Create student error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Email or roll number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update student (Super Admin only)
router.put('/students/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, email, rollNumber, parentEmail, classId, departmentId, password } = req.body;
    const student = await User.findByPk(req.params.id);

    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // If classId is being updated, get the department from the class
    let finalDepartmentId = departmentId !== undefined ? departmentId : student.departmentId;
    if (classId !== undefined && classId !== student.classId) {
      if (classId) {
        const classInfo = await Class.findByPk(classId, { attributes: ['departmentId'] });
        if (classInfo) {
          finalDepartmentId = classInfo.departmentId;
        }
      } else {
        // If classId is being set to null, keep the current department
        finalDepartmentId = departmentId !== undefined ? departmentId : student.departmentId;
      }
    }

    // Prepare update data
    const updateData = {
      name: name || student.name,
      email: email || student.email,
      rollNumber: rollNumber || student.rollNumber,
      parentEmail: parentEmail || student.parentEmail,
      classId: classId !== undefined ? classId : student.classId,
      departmentId: finalDepartmentId
    };

    // Hash password if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await student.update(updateData);

    // Fetch updated student with relations
    const updatedStudent = await User.findByPk(student.id, {
      include: [
        { model: Class, as: 'class', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      id: updatedStudent.id,
      name: updatedStudent.name,
      email: updatedStudent.email,
      rollNumber: updatedStudent.rollNumber,
      parentEmail: updatedStudent.parentEmail,
      classId: updatedStudent.classId,
      departmentId: updatedStudent.departmentId,
      class: updatedStudent.class,
      department: updatedStudent.department
    });
  } catch (error) {
    console.error('Update student error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Email or roll number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete student (Super Admin only)
router.delete('/students/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const student = await User.findByPk(req.params.id);

    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student not found' });
    }

    await student.update({ isActive: false });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ======================= STAFF ======================= //

// Get all staff (Super Admin only)
router.get('/staff', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const whereClause = { role: 'STAFF', isActive: true };
    
    // Department filtering
    if (req.query.departmentId) {
      const deptId = Number(req.query.departmentId);
      if (!Number.isNaN(deptId)) {
        whereClause.departmentId = deptId;
      }
    }

    const staff = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'departmentId', 'createdAt', 'lastLogin'],
      include: [
        { 
          model: Class, 
          as: 'managedClass', 
          attributes: ['id', 'name'],
          required: false 
        },
        { 
          model: Department, 
          as: 'department', 
          attributes: ['id', 'name'],
          required: false 
        },
        {
          model: Class,
          as: 'assignedClasses',
          through: { attributes: ['assignedAt'] },
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });
    
    // Format response to include both single class (backward compatibility) and multiple classes
    const formattedStaff = staff.map(staffMember => {
      const staffData = staffMember.toJSON();
      
      // Combine managedClass and assignedClasses to show all classes
      let allClasses = [];
      
      // Add single managed class if exists (backward compatibility)
      if (staffData.managedClass) {
        allClasses.push(staffData.managedClass);
      }
      
      // Add assigned classes from many-to-many relationship
      if (staffData.assignedClasses && staffData.assignedClasses.length > 0) {
        staffData.assignedClasses.forEach(cls => {
          // Avoid duplicates if same class appears in both single and multiple assignments
          if (!allClasses.some(existing => existing.id === cls.id)) {
            allClasses.push(cls);
          }
        });
      }
      
      return {
        ...staffData,
        managedClasses: allClasses,
        status: staffData.lastLogin ? 'active' : 'inactive',
        joinDate: staffData.createdAt
      };
    });
    
    res.json(formattedStaff);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get classes (Super Admin and Staff)
router.get('/classes', authenticateToken, requireRole('SUPER_ADMIN', 'STAFF'), async (req, res) => {
  try {
    const whereClause = {};
    
    // STAFF: Filter by their department only
    if (req.user.role === 'STAFF' && req.user.departmentId) {
      whereClause.departmentId = req.user.departmentId;
    } else if (req.user.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN: Can filter by any department or see all
      if (req.query.departmentId) {
        const deptId = Number(req.query.departmentId);
        if (!Number.isNaN(deptId)) {
          whereClause.departmentId = deptId;
        }
      }
    }

    const classes = await Class.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'staffId', 'departmentId'],
      include: [
        { 
          model: User, 
          as: 'staff', 
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    // Get student counts for each class
    const classesWithCounts = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await User.count({
          where: { classId: cls.id, role: 'STUDENT', isActive: true }
        });
        return {
          ...cls.toJSON(),
          studentCount
        };
      })
    );

    res.json(classesWithCounts);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create staff (Super Admin only)
router.post('/staff', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, email, password, className, departmentId, classId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // If classId is provided, get the department from the class
    let finalDepartmentId = departmentId;
    if (classId && !departmentId) {
      const classInfo = await Class.findByPk(classId, { attributes: ['departmentId'] });
      if (classInfo) {
        finalDepartmentId = classInfo.departmentId;
      }
    }

    const staff = await User.create({
      name,
      email,
      passwordHash: password,
      role: 'STAFF',
      departmentId: finalDepartmentId || null
    });

    // Optionally create/assign a class to this staff
    if (className && className.trim()) {
      let cls = await Class.findOne({ where: { name: className.trim() } });
      if (!cls) {
        cls = await Class.create({ 
          name: className.trim(), 
          staffId: staff.id,
          departmentId: finalDepartmentId
        });
      } else {
        await cls.update({ staffId: staff.id });
      }
    }

    // If classId is provided, assign staff to that class
    if (classId) {
      const cls = await Class.findByPk(classId);
      if (cls) {
        await cls.update({ staffId: staff.id });
      }
    }

    // Fetch created staff with relations
    const createdStaff = await User.findByPk(staff.id, {
      include: [
        { model: Class, as: 'managedClass', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json({
      id: createdStaff.id,
      name: createdStaff.name,
      email: createdStaff.email,
      departmentId: createdStaff.departmentId,
      department: createdStaff.department,
      managedClass: createdStaff.managedClass
    });
  } catch (error) {
    console.error('Create staff error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update staff (Super Admin only)
router.put('/staff/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, email, password, className, departmentId, classId } = req.body;
    const staff = await User.findByPk(req.params.id);

    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // If classId is being updated, get the department from the class
    let finalDepartmentId = departmentId !== undefined ? departmentId : staff.departmentId;
    if (classId !== undefined && classId !== staff.classId) {
      if (classId) {
        const classInfo = await Class.findByPk(classId, { attributes: ['departmentId'] });
        if (classInfo) {
          finalDepartmentId = classInfo.departmentId;
        }
      }
    }

    // Prepare update data
    const updateData = {
      name: name || staff.name,
      email: email || staff.email,
      departmentId: finalDepartmentId
    };

    // Hash password if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      const saltRounds = 12;
      updateData.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await staff.update(updateData);

    // Update or create class assignment
    if (className !== undefined) {
      if (className && className.trim()) {
        let cls = await Class.findOne({ where: { name: className.trim() } });
        if (!cls) {
          cls = await Class.create({ 
            name: className.trim(), 
            staffId: staff.id,
            departmentId: finalDepartmentId
          });
        } else {
          await cls.update({ staffId: staff.id });
        }
      } else {
        // If empty string provided, unassign managed class from this staff
        const existing = await Class.findOne({ where: { staffId: staff.id } });
        if (existing) await existing.update({ staffId: null });
      }
    }

    // Handle direct class assignment
    if (classId !== undefined) {
      // First, unassign from current class if any
      const currentClass = await Class.findOne({ where: { staffId: staff.id } });
      if (currentClass) {
        await currentClass.update({ staffId: null });
      }
      
      // Assign to new class if provided
      if (classId) {
        const cls = await Class.findByPk(classId);
        if (cls) {
          await cls.update({ staffId: staff.id });
        }
      }
    }

    // Fetch updated staff with relations
    const updatedStaff = await User.findByPk(staff.id, {
      include: [
        { model: Class, as: 'managedClass', attributes: ['id', 'name'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      id: updatedStaff.id,
      name: updatedStaff.name,
      email: updatedStaff.email,
      departmentId: updatedStaff.departmentId,
      department: updatedStaff.department,
      managedClass: updatedStaff.managedClass
    });
  } catch (error) {
    console.error('Update staff error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete staff (Super Admin only)
router.delete('/staff/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const staff = await User.findByPk(req.params.id);

    if (!staff || staff.role !== 'STAFF') {
      return res.status(404).json({ error: 'Staff not found' });
    }

    await staff.update({ isActive: false });
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======================= CLASSES ======================= //

// Create class (Super Admin only)
router.post('/classes', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, staffId, departmentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    if (!departmentId) {
      return res.status(400).json({ error: 'Department is required' });
    }

    // Check if class name already exists in the same department
    const existingClass = await Class.findOne({ 
      where: { 
        name: name.trim(),
        departmentId: departmentId
      } 
    });
    if (existingClass) {
      return res.status(400).json({ error: 'Class name already exists in this department' });
    }

    // Validate department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(400).json({ error: 'Invalid department selected' });
    }

    // Validate staff if provided
    if (staffId) {
      const staff = await User.findOne({ 
        where: { id: staffId, role: 'STAFF', isActive: true } 
      });
      if (!staff) {
        return res.status(400).json({ error: 'Invalid staff member selected' });
      }
    }

    const newClass = await Class.create({
      name: name.trim(),
      staffId: staffId || null,
      departmentId: departmentId
    });

    // Fetch the created class with staff and department info
    const classWithRelations = await Class.findByPk(newClass.id, {
      include: [
        { 
          model: User, 
          as: 'staff', 
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    // Get student count
    const studentCount = await User.count({
      where: { classId: newClass.id, role: 'STUDENT', isActive: true }
    });

    res.status(201).json({
      ...classWithRelations.toJSON(),
      studentCount
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class (Super Admin only)
router.put('/classes/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, staffId, departmentId } = req.body;
    const cls = await Class.findByPk(req.params.id);

    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Validate new name if provided
    if (name && name.trim() !== cls.name) {
      const finalDepartmentId = departmentId !== undefined ? departmentId : cls.departmentId;
      const existingClass = await Class.findOne({ 
        where: { 
          name: name.trim(), 
          departmentId: finalDepartmentId,
          id: { [require('sequelize').Op.ne]: cls.id } 
        } 
      });
      if (existingClass) {
        return res.status(400).json({ error: 'Class name already exists in this department' });
      }
    }

    // Validate department if provided
    if (departmentId !== undefined && departmentId !== cls.departmentId) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(400).json({ error: 'Invalid department selected' });
      }
    }

    // Validate staff if provided
    if (staffId !== undefined && staffId !== null) {
      const staff = await User.findOne({ 
        where: { id: staffId, role: 'STAFF', isActive: true } 
      });
      if (!staff) {
        return res.status(400).json({ error: 'Invalid staff member selected' });
      }
    }

    await cls.update({
      name: name?.trim() || cls.name,
      staffId: staffId !== undefined ? staffId : cls.staffId,
      departmentId: departmentId !== undefined ? departmentId : cls.departmentId
    });

    // Fetch updated class with staff and department info
    const updatedClass = await Class.findByPk(cls.id, {
      include: [
        { 
          model: User, 
          as: 'staff', 
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    // Get student count
    const studentCount = await User.count({
      where: { classId: cls.id, role: 'STUDENT', isActive: true }
    });

    res.json({
      ...updatedClass.toJSON(),
      studentCount
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class (Super Admin only)
router.delete('/classes/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const cls = await Class.findByPk(req.params.id);

    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if class has students
    const studentCount = await User.count({
      where: { classId: cls.id, role: 'STUDENT', isActive: true }
    });

    if (studentCount > 0) {
      // Unassign students from this class before deleting
      await User.update(
        { classId: null },
        { where: { classId: cls.id, role: 'STUDENT' } }
      );
    }

    await cls.destroy();
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign students to class (Super Admin only)
router.post('/classes/:id/assign-students', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { studentIds } = req.body;
    const classId = req.params.id;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Student IDs are required' });
    }

    // Verify class exists
    const cls = await Class.findByPk(classId);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Verify all students exist and are active
    const students = await User.findAll({
      where: {
        id: studentIds,
        role: 'STUDENT',
        isActive: true
      }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ error: 'Some students not found or inactive' });
    }

    // Update students to assign them to the class
    await User.update(
      { classId: classId },
      { where: { id: studentIds } }
    );

    // Return updated students with class info
    const updatedStudents = await User.findAll({
      where: { id: studentIds },
      attributes: ['id', 'name', 'email', 'rollNumber', 'classId'],
      include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }]
    });

    res.json({ 
      message: 'Students assigned successfully',
      students: updatedStudents 
    });
  } catch (error) {
    console.error('Assign students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get students not assigned to any class (Super Admin only)
router.get('/students/unassigned', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const unassignedStudents = await User.findAll({
      where: {
        role: 'STUDENT',
        isActive: true,
        classId: null
      },
      attributes: ['id', 'name', 'email', 'rollNumber'],
      order: [['rollNumber', 'ASC']]
    });

    res.json(unassignedStudents);
  } catch (error) {
    console.error('Get unassigned students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======================= CLASSES ======================= //

// Get all classes with student count
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const classes = await Class.findAll({
      attributes: [
        'id', 
        'name', 
        'staffId',
        'createdAt',
        'updatedAt'
      ],
      include: [
        {
          model: User,
          as: 'students',
          attributes: ['id'],
          where: { isActive: true },
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    // Add student count to each class
    const classesWithCount = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      staffId: cls.staffId,
      studentCount: cls.students ? cls.students.length : 0,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt
    }));

    res.json(classesWithCount);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======================= STAFF CLASS ASSIGNMENTS ======================= //

// Assign classes to staff member (Super Admin only)
router.post('/staff/:staffId/assign-classes', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { classIds } = req.body;
    const staffId = parseInt(req.params.staffId);

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({ error: 'Class IDs array is required' });
    }

    // Verify staff member exists and is active
    const staff = await User.findOne({
      where: { id: staffId, role: 'STAFF', isActive: true }
    });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Verify all classes exist and get their departments
    const classes = await Class.findAll({
      where: { id: classIds },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }]
    });
    
    if (classes.length !== classIds.length) {
      return res.status(400).json({ error: 'Some classes not found' });
    }

    // Check department restrictions (staff can only be assigned to classes in their department or any department for super admin)
    const staffDepartment = staff.departmentId;
    const invalidClasses = classes.filter(cls => 
      staffDepartment && cls.departmentId && cls.departmentId !== staffDepartment
    );
    
    if (invalidClasses.length > 0 && req.user.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ 
        error: 'Staff can only be assigned to classes within their department',
        invalidClasses: invalidClasses.map(cls => ({ id: cls.id, name: cls.name }))
      });
    }

    // Create assignments (ignore duplicates)
    const assignments = [];
    for (const classId of classIds) {
      try {
        const assignment = await StaffClass.findOrCreate({
          where: { staffId, classId },
          defaults: {
            staffId,
            classId,
            assignedBy: req.user.id,
            assignedAt: new Date()
          }
        });
        if (assignment[1]) { // Only add if newly created
          assignments.push(assignment[0]);
        }
      } catch (error) {
        if (error.name !== 'SequelizeUniqueConstraintError') {
          throw error;
        }
        // Ignore duplicate assignments
      }
    }

    // Get updated staff with all assigned classes
    const updatedStaff = await User.findByPk(staffId, {
      include: [
        {
          model: Class,
          as: 'assignedClasses',
          through: { attributes: ['assignedAt'] },
          attributes: ['id', 'name']
        },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      message: `${assignments.length} new class assignments created`,
      staff: {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        department: updatedStaff.department,
        assignedClasses: updatedStaff.assignedClasses
      }
    });
  } catch (error) {
    console.error('Assign classes to staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove classes from staff member (Super Admin only)
router.delete('/staff/:staffId/remove-classes', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { classIds } = req.body;
    const staffId = parseInt(req.params.staffId);

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({ error: 'Class IDs array is required' });
    }

    // Remove assignments
    const deletedCount = await StaffClass.destroy({
      where: {
        staffId,
        classId: classIds
      }
    });

    // Get updated staff with remaining assigned classes
    const updatedStaff = await User.findByPk(staffId, {
      include: [
        {
          model: Class,
          as: 'assignedClasses',
          through: { attributes: ['assignedAt'] },
          attributes: ['id', 'name']
        },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    res.json({
      message: `${deletedCount} class assignments removed`,
      staff: {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        department: updatedStaff.department,
        assignedClasses: updatedStaff.assignedClasses
      }
    });
  } catch (error) {
    console.error('Remove classes from staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all classes assigned to a staff member (Super Admin only)
router.get('/staff/:staffId/classes', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const staffId = parseInt(req.params.staffId);

    const staff = await User.findByPk(staffId, {
      where: { role: 'STAFF', isActive: true },
      include: [
        {
          model: Class,
          as: 'assignedClasses',
          through: { 
            attributes: ['assignedAt'],
            include: [
              {
                model: User,
                as: 'assignedByUser',
                attributes: ['id', 'name']
              }
            ]
          },
          attributes: ['id', 'name'],
          include: [
            { model: Department, as: 'department', attributes: ['id', 'name'] }
          ]
        },
        { model: Department, as: 'department', attributes: ['id', 'name'] }
      ]
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        department: staff.department
      },
      assignedClasses: staff.assignedClasses
    });
  } catch (error) {
    console.error('Get staff classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available classes for assignment (Super Admin only)
router.get('/staff/:staffId/available-classes', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const staffId = parseInt(req.params.staffId);

    // Get staff member to check their department
    const staff = await User.findByPk(staffId, {
      where: { role: 'STAFF', isActive: true },
      attributes: ['id', 'departmentId'],
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }]
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Get currently assigned classes
    const assignedClassIds = await StaffClass.findAll({
      where: { staffId },
      attributes: ['classId']
    }).then(assignments => assignments.map(a => a.classId));

    // Get available classes (in same department for regular assignments, all for super admin override)
    const whereClause = {};
    if (staff.departmentId && req.user.role !== 'SUPER_ADMIN') {
      whereClause.departmentId = staff.departmentId;
    }

    // Exclude already assigned classes
    if (assignedClassIds.length > 0) {
      whereClause.id = { [Op.notIn]: assignedClassIds };
    }

    const availableClasses = await Class.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'departmentId'],
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { 
          model: User, 
          as: 'staff', 
          attributes: ['id', 'name'],
          required: false 
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      staff: {
        id: staff.id,
        department: staff.department
      },
      availableClasses
    });
  } catch (error) {
    console.error('Get available classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ======================= PROFILE ENDPOINTS ======================= //

// Get detailed student profile (Super Admin or self access)
router.get('/students/:id/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    
    // Access control: Super Admin can view any profile, Students can only view their own
    if (req.user.role !== 'SUPER_ADMIN') {
      if (req.user.role !== 'STUDENT' || req.user.id !== studentId) {
        return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
      }
    }

    const student = await User.findByPk(studentId, {
      where: { role: 'STUDENT', isActive: true },
      attributes: [
        'id', 'name', 'email', 'rollNumber', 'parentEmail', 'classId', 'departmentId',
        'isActive', 'lastLogin', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name'],
          include: [
            {
              model: User,
              as: 'staff',
              attributes: ['id', 'name', 'email'],
              required: false
            }
          ]
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: User,
              as: 'head',
              attributes: ['id', 'name', 'email'],
              required: false
            }
          ]
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get department statistics
    let departmentStats = {};
    if (student.department) {
      const [studentCount, staffCount, classCount] = await Promise.all([
        User.count({ where: { departmentId: student.departmentId, role: 'STUDENT', isActive: true } }),
        User.count({ where: { departmentId: student.departmentId, role: 'STAFF', isActive: true } }),
        Class.count({ where: { departmentId: student.departmentId } })
      ]);
      
      departmentStats = { studentCount, staffCount, classCount };
    }

    const studentData = student.toJSON();
    if (studentData.department) {
      studentData.department = { ...studentData.department, ...departmentStats };
    }

    res.json({
      ...studentData,
      role: 'STUDENT'
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed staff profile (Super Admin or self access)
router.get('/staff/:id/profile', authenticateToken, async (req, res) => {
  try {
    const staffId = parseInt(req.params.id);
    
    // Access control: Super Admin can view any profile, Staff can only view their own
    if (req.user.role !== 'SUPER_ADMIN') {
      if (req.user.role !== 'STAFF' || req.user.id !== staffId) {
        return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
      }
    }

    const staff = await User.findByPk(staffId, {
      where: { role: 'STAFF', isActive: true },
      attributes: [
        'id', 'name', 'email', 'role', 'departmentId',
        'isActive', 'lastLogin', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Class,
          as: 'managedClass',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Class,
          as: 'assignedClasses',
          through: { attributes: ['assignedAt'] },
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description'],
          include: [
            {
              model: User,
              as: 'head',
              attributes: ['id', 'name', 'email'],
              required: false
            }
          ],
          required: false
        }
      ]
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Get department statistics
    let departmentStats = {};
    if (staff.department) {
      const [studentCount, staffCount, classCount] = await Promise.all([
        User.count({ where: { departmentId: staff.departmentId, role: 'STUDENT', isActive: true } }),
        User.count({ where: { departmentId: staff.departmentId, role: 'STAFF', isActive: true } }),
        Class.count({ where: { departmentId: staff.departmentId } })
      ]);
      
      departmentStats = { studentCount, staffCount, classCount };
    }

    // Get managed classes with student counts
    const managedClasses = [];
    const allClasses = [];
    
    // Add single managed class (backward compatibility)
    if (staff.managedClass) {
      const studentCount = await User.count({
        where: { classId: staff.managedClass.id, role: 'STUDENT', isActive: true }
      });
      managedClasses.push({
        id: staff.managedClass.id,
        name: staff.managedClass.name,
        studentCount
      });
      allClasses.push({ id: staff.managedClass.id, name: staff.managedClass.name, studentCount });
    }

    // Add assigned classes from many-to-many relationship
    if (staff.assignedClasses && staff.assignedClasses.length > 0) {
      for (const cls of staff.assignedClasses) {
        // Avoid duplicates
        if (!allClasses.some(existing => existing.id === cls.id)) {
          const studentCount = await User.count({
            where: { classId: cls.id, role: 'STUDENT', isActive: true }
          });
          allClasses.push({ id: cls.id, name: cls.name, studentCount });
        }
      }
    }

    const staffData = staff.toJSON();
    if (staffData.department) {
      staffData.department = { ...staffData.department, ...departmentStats };
    }

    res.json({
      ...staffData,
      managedClasses: managedClasses.length > 0 ? managedClasses : undefined,
      assignedClasses: allClasses.length > 0 ? allClasses : undefined
    });
  } catch (error) {
    console.error('Get staff profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
