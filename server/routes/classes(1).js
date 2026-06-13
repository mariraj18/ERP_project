import express from 'express';
import { Class, Department, User } from '../models/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all classes with department and staff info
router.get('/', authenticateToken, async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'incharge',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get classes by department
router.get('/department/:departmentId', authenticateToken, async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const classes = await Class.findAll({
      where: { departmentId },
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'incharge',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes by department:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get single class by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const classItem = await Class.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'incharge',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ]
    });

    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classItem);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// Create new class
router.post('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, departmentId, staffId } = req.body;

    // Validate required fields
    if (!name || !departmentId) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if staff exists (if provided)
    if (staffId) {
      const staff = await User.findOne({
        where: { 
          id: staffId,
          role: 'STAFF'
        }
      });
      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
    }

    // Check if class name already exists in the department
    const existingClass = await Class.findOne({
      where: { 
        name,
        departmentId
      }
    });

    if (existingClass) {
      return res.status(400).json({ error: 'Class name already exists in this department' });
    }

    // Create the class
    const newClass = await Class.create({
      name,
      departmentId,
      staffId: staffId || null
    });

    // Fetch the created class with associations
    const createdClass = await Class.findByPk(newClass.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'incharge',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ]
    });

    res.status(201).json(createdClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Update class
router.put('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentId, staffId } = req.body;

    // Find the class
    const classItem = await Class.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Validate required fields
    if (!name || !departmentId) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if staff exists (if provided)
    if (staffId) {
      const staff = await User.findOne({
        where: { 
          id: staffId,
          role: 'STAFF'
        }
      });
      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
    }

    // Check if class name already exists in the department (excluding current class)
    const existingClass = await Class.findOne({
      where: { 
        name,
        departmentId,
        id: { [Op.ne]: id }
      }
    });

    if (existingClass) {
      return res.status(400).json({ error: 'Class name already exists in this department' });
    }

    // Update the class
    await classItem.update({
      name,
      departmentId,
      staffId: staffId || null
    });

    // Fetch the updated class with associations
    const updatedClass = await Class.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'incharge',
          attributes: ['id', 'name', 'email', 'role'],
          required: false
        }
      ]
    });

    res.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete class
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Find the class
    const classItem = await Class.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if there are students assigned to this class
    const studentsCount = await User.count({
      where: { 
        classId: id,
        role: 'STUDENT'
      }
    });

    if (studentsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete class. ${studentsCount} students are still assigned to this class.`,
        studentsCount
      });
    }

    // Check if there are staff assigned to this class
    const staffCount = await User.count({
      where: { 
        classId: id,
        role: 'STAFF'
      }
    });

    if (staffCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete class. ${staffCount} staff members are still assigned to this class.`,
        staffCount
      });
    }

    // Delete the class
    await classItem.destroy();

    res.json({ 
      message: 'Class deleted successfully',
      deletedClass: {
        id: classItem.id,
        name: classItem.name
      }
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// Get class statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if class exists
    const classItem = await Class.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get students count
    const studentsCount = await User.count({
      where: { 
        classId: id,
        role: 'STUDENT'
      }
    });

    // Get staff count
    const staffCount = await User.count({
      where: { 
        classId: id,
        role: 'STAFF'
      }
    });

    // Get class incharge
    const incharge = await User.findOne({
      where: { id: classItem.staffId },
      attributes: ['id', 'name', 'email', 'role']
    });

    res.json({
      classId: id,
      className: classItem.name,
      studentsCount,
      staffCount,
      incharge: incharge || null,
      totalMembers: studentsCount + staffCount
    });
  } catch (error) {
    console.error('Error fetching class statistics:', error);
    res.status(500).json({ error: 'Failed to fetch class statistics' });
  }
});

// Assign students to class
router.post('/:id/assign-students', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Student IDs are required' });
    }

    // Check if class exists
    const classItem = await Class.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update students' classId and departmentId
    const updatePromises = studentIds.map(studentId => 
      User.update(
        { 
          classId: id,
          departmentId: classItem.departmentId 
        },
        { 
          where: { 
            id: studentId, 
            role: 'STUDENT' 
          } 
        }
      )
    );

    await Promise.all(updatePromises);

    res.json({ 
      message: 'Students assigned successfully',
      assignedCount: studentIds.length,
      classId: id
    });
  } catch (error) {
    console.error('Error assigning students to class:', error);
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

export default router;
