import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
    // Create staff_classes junction table
    await queryInterface.createTable('staff_classes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'staff_id',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      classId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'class_id',
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'assigned_at',
        defaultValue: Sequelize.fn('NOW')
      },
      assignedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'assigned_by',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add unique constraint for staff-class combination
    await queryInterface.addIndex('staff_classes', {
      fields: ['staff_id', 'class_id'],
      unique: true,
      name: 'unique_staff_class'
    });

    // Add index for faster queries by staff
    await queryInterface.addIndex('staff_classes', {
      fields: ['staff_id'],
      name: 'staff_classes_staff_id_idx'
    });

    // Add index for faster queries by class
    await queryInterface.addIndex('staff_classes', {
      fields: ['class_id'],
      name: 'staff_classes_class_id_idx'
    });

    // Migrate existing staff-class relationships from classes table to junction table
    const [existingAssignments] = await queryInterface.sequelize.query(`
      SELECT id as class_id, staff_id 
      FROM classes 
      WHERE staff_id IS NOT NULL;
    `);

    if (existingAssignments.length > 0) {
      console.log(`Migrating ${existingAssignments.length} existing staff-class assignments...`);
      
      for (const assignment of existingAssignments) {
        await queryInterface.sequelize.query(`
          INSERT INTO staff_classes (staff_id, class_id, assigned_at, created_at, updated_at)
          VALUES (:staffId, :classId, NOW(), NOW(), NOW())
          ON CONFLICT (staff_id, class_id) DO NOTHING;
        `, {
          replacements: {
            staffId: assignment.staff_id,
            classId: assignment.class_id
          }
        });
      }
      
      console.log(`Migration completed for ${existingAssignments.length} staff-class assignments.`);
    }
}

export async function down(queryInterface, Sequelize) {
  // Drop the staff_classes table
  await queryInterface.dropTable('staff_classes');
}
