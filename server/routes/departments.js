import express from 'express';
import { Department, User, Class } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();


// Get all departments
router.get('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'head',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          where: { role: 'STUDENT' },
          required: false
        },
        {
          model: Class,
          as: 'classes',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    const departmentsWithStats = departments.map(dept => ({
      ...dept.toJSON(),
      studentCount: dept.users?.length || 0,
      classCount: dept.classes?.length || 0
    }));

    res.json(departmentsWithStats);
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single department (accessible by SUPER_ADMIN and STAFF)
router.get('/:id', authenticateToken, requireRole('SUPER_ADMIN', 'STAFF'), async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'head',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Class,
          as: 'classes',
          attributes: ['id', 'name'],
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

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get additional statistics
    const [studentCount, staffCount] = await Promise.all([
      User.count({ where: { departmentId: req.params.id, role: 'STUDENT' } }),
      User.count({ where: { departmentId: req.params.id, role: 'STAFF' } })
    ]);

    const departmentWithStats = {
      ...department.toJSON(),
      studentCount,
      staffCount,
      classCount: department.classes?.length || 0
    };

    res.json(departmentWithStats);
  } catch (error) {
    console.error('Failed to fetch department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create department
router.post('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, description, headId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    // Check if department name already exists
    const existingDepartment = await Department.findOne({ where: { name } });
    if (existingDepartment) {
      return res.status(400).json({ error: 'Department name already exists' });
    }

    // If headId is provided, verify the user exists and is staff
    if (headId) {
      const head = await User.findByPk(headId);
      if (!head || head.role !== 'STAFF') {
        return res.status(400).json({ error: 'Invalid head user or user is not staff' });
      }
    }

    const department = await Department.create({
      name,
      description,
      headId: headId || null
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Failed to create department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update department
router.put('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, description, headId } = req.body;

    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if department name already exists (excluding current department)
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ 
        where: { name, id: { [Op.ne]: req.params.id } }
      });
      if (existingDepartment) {
        return res.status(400).json({ error: 'Department name already exists' });
      }
    }

    // If headId is provided, verify the user exists and is staff
    if (headId) {
      const head = await User.findByPk(headId);
      if (!head || head.role !== 'STAFF') {
        return res.status(400).json({ error: 'Invalid head user or user is not staff' });
      }
    }

    await department.update({
      name: name || department.name,
      description: description !== undefined ? description : department.description,
      headId: headId !== undefined ? headId : department.headId
    });

    res.json(department);
  } catch (error) {
    console.error('Failed to update department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete department
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if department has classes
    const classCount = await Class.count({ where: { departmentId: req.params.id } });
    if (classCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with existing classes. Please move or delete classes first.' 
      });
    }

    // Check if department has users
    const userCount = await User.count({ where: { departmentId: req.params.id } });
    if (userCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete department with existing users. Please move users to another department first.' 
      });
    }

    await department.destroy();
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Failed to delete department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department statistics
router.get('/:id/stats', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const [
      studentCount,
      staffCount,
      classCount,
      activeStudents,
      inactiveStudents
    ] = await Promise.all([
      User.count({ where: { departmentId: req.params.id, role: 'STUDENT' } }),
      User.count({ where: { departmentId: req.params.id, role: 'STAFF' } }),
      Class.count({ where: { departmentId: req.params.id } }),
      User.count({ where: { departmentId: req.params.id, role: 'STUDENT', isActive: true } }),
      User.count({ where: { departmentId: req.params.id, role: 'STUDENT', isActive: false } })
    ]);

    res.json({
      studentCount,
      staffCount,
      classCount,
      activeStudents,
      inactiveStudents
    });
  } catch (error) {
    console.error('Failed to fetch department stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Assign staff to department
router.post('/:id/assign-staff', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { staffIds } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Update staff members with department assignment
    await User.update(
      { departmentId: id },
      { 
        where: { 
          id: staffIds,
          role: 'STAFF'
        }
      }
    );

    res.json({ message: 'Staff assigned successfully' });
  } catch (error) {
    console.error('Failed to assign staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign students to class
router.post('/:id/classes/:classId/assign-students', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id, classId } = req.params;
    const { studentIds } = req.body;

    const department = await Department.findByPk(id);
    const classItem = await Class.findByPk(classId);
    
    if (!department || !classItem) {
      return res.status(404).json({ error: 'Department or class not found' });
    }

    // Update students with department and class assignment
    await User.update(
      { 
        departmentId: id,
        classId: classId
      },
      { 
        where: { 
          id: studentIds,
          role: 'STUDENT'
        }
      }
    );

    res.json({ message: 'Students assigned successfully' });
  } catch (error) {
    console.error('Failed to assign students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unassigned staff
router.get('/unassigned-staff', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const unassignedStaff = await User.findAll({
      where: {
        role: 'STAFF',
        departmentId: null
      },
      attributes: ['id', 'name', 'email']
    });

    res.json(unassignedStaff);
  } catch (error) {
    console.error('Failed to fetch unassigned staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unassigned students
router.get('/unassigned-students', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const unassignedStudents = await User.findAll({
      where: {
        role: 'STUDENT',
        [Op.or]: [
          { departmentId: null },
          { classId: null }
        ]
      },
      attributes: ['id', 'name', 'email', 'rollNumber']
    });

    res.json(unassignedStudents);
  } catch (error) {
    console.error('Failed to fetch unassigned students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all staff for department head assignment
router.get('/available-staff', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        role: 'STAFF',
        isActive: true
      },
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(staff);
  } catch (error) {
    console.error('Failed to fetch staff:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

