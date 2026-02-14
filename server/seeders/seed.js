import sequelize from '../config/database.js';
import { User, Attendance, Message, Class, Department } from '../models/index.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database first
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Dr. College Administrator',
      email: 'admin@college.com',
      passwordHash: 'Admin@123',
      role: 'SUPER_ADMIN'
    });
    console.log('✅ Super Admin created');

    // Create Departments
    const departments = await Department.bulkCreate([
      {
        name: 'Computer Science & Engineering',
        description: 'Department of Computer Science and Engineering focusing on software development, algorithms, and emerging technologies.'
      },
      {
        name: 'Information Technology', 
        description: 'Department of Information Technology specializing in IT infrastructure, systems management, and digital solutions.'
      },
      {
        name: 'Electronics & Communication Engineering',
        description: 'Department of Electronics and Communication Engineering covering digital systems, telecommunications, and embedded systems.'
      },
      {
        name: 'Mechanical Engineering',
        description: 'Department of Mechanical Engineering focusing on design, manufacturing, and thermal systems.'
      },
      {
        name: 'Civil Engineering',
        description: 'Department of Civil Engineering specializing in structural design, construction management, and infrastructure development.'
      }
    ], {
      ignoreDuplicates: true
    });
    console.log('✅ Departments created');

    // Create Staff
    const staff1 = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });

    const staff2 = await User.create({
      name: 'Prof. Priya Sharma',
      email: 'priya.sharma@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });

    const staff3 = await User.create({
      name: 'Dr. Arjun Patel',
      email: 'arjun.patel@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });

    const staff4 = await User.create({
      name: 'Prof. Sneha Reddy',
      email: 'sneha.reddy@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });

    const staff5 = await User.create({
      name: 'Dr. Vikram Singh',
      email: 'vikram.singh@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });

    const staff6 = await User.create({
      name: 'Dr. Anil Gupta',
      email: 'anil.gupta@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });

    const staff7 = await User.create({
      name: 'Dr. Sunil Mehta',
      email: 'sunil.mehta@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });

    const staff8 = await User.create({
      name: 'Dr. Neha Verma',
      email: 'neha.verma@college.com',
      passwordHash: 'Staff@123',
      role: 'STAFF'
    });
    console.log('✅ Staff members created');

    // Assign staff to departments
    const staffList = [staff1, staff2, staff3, staff4, staff5, staff6, staff7, staff8];
    for (let i = 0; i < staffList.length; i++) {
      const deptIndex = i % departments.length;
      await staffList[i].update({
        departmentId: departments[deptIndex].id
      });
    }
    console.log('✅ Staff assigned to departments');
    
    // Create Classes with department assignments (ensuring staff are only assigned to classes in their own department)
    const class1 = await Class.create({ name: 'BCA First Year', staffId: staff1.id, departmentId: departments[0].id });
    const class2 = await Class.create({ name: 'BCA Second Year', staffId: staff2.id, departmentId: departments[0].id });
    const class3 = await Class.create({ name: 'B.Tech CSE First Year', staffId: staff1.id, departmentId: departments[0].id });
    const class4 = await Class.create({ name: 'B.Tech CSE Second Year', staffId: staff2.id, departmentId: departments[0].id });
    const class5 = await Class.create({ name: 'B.Tech IT First Year', staffId: staff3.id, departmentId: departments[1].id });
    const class6 = await Class.create({ name: 'B.Tech IT Second Year', staffId: staff4.id, departmentId: departments[1].id });
    const class7 = await Class.create({ name: 'MCA First Year', staffId: staff1.id, departmentId: departments[0].id }); // Fixed: staff1 is in CSE dept
    const class8 = await Class.create({ name: 'B.Tech ECE First Year', staffId: staff5.id, departmentId: departments[2].id });
    const class9 = await Class.create({ name: 'B.Tech ECE Second Year', staffId: staff5.id, departmentId: departments[2].id });
    const class10 = await Class.create({ name: 'B.Tech ME First Year', staffId: staff6.id, departmentId: departments[3].id });
    const class11 = await Class.create({ name: 'B.Tech CE First Year', staffId: staff7.id, departmentId: departments[4].id });
    const class12 = await Class.create({ name: 'B.Tech AI First Year', staffId: staff8.id, departmentId: departments[0].id });
    console.log('✅ Classes created with department assignments');

    // Create Students
    const students = [
      // Computer Science Students
      { name: 'Gnana Subashini', email: 'ranimeeranimee@gmail.com', rollNumber: 'CS001', parentEmail: 'ranimeeranimee@gmail.com', classId: class1.id },
      { name: 'Laddu', email: 'cxndy.mee@gmail.com', rollNumber: 'CS002', parentEmail: 'cxndy.mee@gmail.com', classId: class1.id },
      { name: 'Aarav Sharma', email: 'aarav.sharma@student.com', rollNumber: 'CS003', parentEmail: 'aarav.parent@gmail.com', classId: class1.id },
      { name: 'Aditi Patel', email: 'aditi.patel@student.com', rollNumber: 'CS004', parentEmail: 'aditi.parent@gmail.com', classId: class1.id },
      { name: 'Rohan Kumar', email: 'rohan.kumar@student.com', rollNumber: 'CS005', parentEmail: 'rohan.parent@gmail.com', classId: class2.id },
      { name: 'Sneha Reddy', email: 'sneha.reddy@student.com', rollNumber: 'CS006', parentEmail: 'sneha.parent@gmail.com', classId: class2.id },
      { name: 'Vikram Singh', email: 'vikram.singh@student.com', rollNumber: 'CS007', parentEmail: 'vikram.parent@gmail.com', classId: class3.id },
      { name: 'Priya Gupta', email: 'priya.gupta@student.com', rollNumber: 'CS008', parentEmail: 'priya.parent@gmail.com', classId: class3.id },

      // IT Students
      { name: 'Arjun Mehta', email: 'arjun.mehta@student.com', rollNumber: 'IT001', parentEmail: 'arjun.parent@gmail.com', classId: class5.id },
      { name: 'Neha Verma', email: 'neha.verma@student.com', rollNumber: 'IT002', parentEmail: 'neha.parent@gmail.com', classId: class5.id },
      { name: 'Raj Malhotra', email: 'raj.malhotra@student.com', rollNumber: 'IT003', parentEmail: 'raj.parent@gmail.com', classId: class6.id },
      { name: 'Pooja Joshi', email: 'pooja.joshi@student.com', rollNumber: 'IT004', parentEmail: 'pooja.parent@gmail.com', classId: class6.id },
      { name: 'Suresh Nair', email: 'suresh.nair@student.com', rollNumber: 'IT005', parentEmail: 'suresh.parent@gmail.com', classId: class7.id },

      // Electronics Students
      { name: 'Kiran Desai', email: 'kiran.desai@student.com', rollNumber: 'EC001', parentEmail: 'kiran.parent@gmail.com', classId: class8.id },
      { name: 'Manoj Tiwari', email: 'manoj.tiwari@student.com', rollNumber: 'EC002', parentEmail: 'manoj.parent@gmail.com', classId: class8.id },
      { name: 'Anjali Choudhary', email: 'anjali.choudhary@student.com', rollNumber: 'EC003', parentEmail: 'anjali.parent@gmail.com', classId: class9.id },

      // Mechanical Students
      { name: 'Rahul Dube', email: 'rahul.dube@student.com', rollNumber: 'ME001', parentEmail: 'rahul.parent@gmail.com', classId: class10.id },
      { name: 'Sanjay Rao', email: 'sanjay.rao@student.com', rollNumber: 'ME002', parentEmail: 'sanjay.parent@gmail.com', classId: class10.id },

      // Civil Students
      { name: 'Deepak Iyer', email: 'deepak.iyer@student.com', rollNumber: 'CE001', parentEmail: 'deepak.parent@gmail.com', classId: class11.id },
      { name: 'Meera Krishnan', email: 'meera.krishnan@student.com', rollNumber: 'CE002', parentEmail: 'meera.parent@gmail.com', classId: class11.id },

      // AI Students
      { name: 'Amitabh Roy', email: 'amitabh.roy@student.com', rollNumber: 'AI001', parentEmail: 'amitabh.parent@gmail.com', classId: class12.id },
      { name: 'Divya Menon', email: 'divya.menon@student.com', rollNumber: 'AI002', parentEmail: 'divya.parent@gmail.com', classId: class12.id }
    ];

    const createdStudents = [];
    for (let index = 0; index < students.length; index++) {
      const studentData = students[index];
      
      // Determine department based on class
      let departmentId;
      if ([class1.id, class2.id, class3.id, class4.id, class7.id, class12.id].includes(studentData.classId)) {
        departmentId = departments[0].id; // Computer Science & Engineering
      } else if ([class5.id, class6.id].includes(studentData.classId)) {
        departmentId = departments[1].id; // Information Technology
      } else if ([class8.id, class9.id].includes(studentData.classId)) {
        departmentId = departments[2].id; // Electronics & Communication
      } else if (class10.id === studentData.classId) {
        departmentId = departments[3].id; // Mechanical Engineering
      } else if (class11.id === studentData.classId) {
        departmentId = departments[4].id; // Civil Engineering
      }
      
      const student = await User.create({
        ...studentData,
        passwordHash: 'Student@123',
        role: 'STUDENT',
        departmentId
      });
      createdStudents.push(student);
    }
    console.log('✅ Students created with department assignments');

    // Create sample attendance records (last 10 days)
    const today = new Date();
    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      for (const student of createdStudents) {
        // Randomly mark students present or absent (80% present)
        const status = Math.random() > 0.2 ? 'PRESENT' : 'ABSENT';
        
        // Find the staff for this student's class
        let staffId;
        if (student.classId === class1.id || student.classId === class3.id || student.classId === class7.id) staffId = staff1.id;
        else if (student.classId === class2.id || student.classId === class4.id) staffId = staff2.id;
        else if (student.classId === class5.id) staffId = staff3.id; // Fixed: staff3 only manages class5 in IT dept
        else if (student.classId === class6.id) staffId = staff4.id;
        else if (student.classId === class8.id || student.classId === class9.id) staffId = staff5.id;
        else if (student.classId === class10.id) staffId = staff6.id;
        else if (student.classId === class11.id) staffId = staff7.id;
        else if (student.classId === class12.id) staffId = staff8.id;
        else staffId = staff1.id; // fallback
        
        await Attendance.create({
          date: dateString,
          status,
          studentId: student.id,
          staffId: staffId,
          remarks: status === 'ABSENT' ? 'No reason provided' : null
        });
      }
    }
    console.log('✅ Sample attendance records created');

    // Create sample messages
    const messages = [
      // Individual Messages
      {
        content: 'Hello Gnana! Your performance in the last assignment was excellent. Keep up the good work!',
        studentId: createdStudents[0].id,
        staffId: staff1.id
      },
      {
        content: 'Please submit your pending project report by tomorrow. Let me know if you need any help.',
        studentId: createdStudents[1].id,
        staffId: staff1.id
      },
      {
        content: 'Your attendance has been low this month. Please make sure to attend classes regularly.',
        studentId: createdStudents[2].id,
        staffId: staff1.id
      },
      {
        content: 'Great job on your presentation today! The research was thorough and well-presented.',
        studentId: createdStudents[5].id,
        staffId: staff2.id
      },
      
      // Class Announcements
      {
        content: 'Important: There will be a quiz on Data Structures next Monday. Chapters 1-5 are included.',
        studentId: createdStudents[0].id,
        staffId: staff1.id
      },
      {
        content: 'Class project submissions are due next Friday. Please ensure all documentation is complete.',
        studentId: createdStudents[1].id,
        staffId: staff1.id
      },
      {
        content: 'Database lab session is rescheduled to Thursday 2 PM. Bring your laptops.',
        studentId: createdStudents[4].id,
        staffId: staff2.id
      },
      
      // College Announcements
      {
        content: 'COLLEGE ANNOUNCEMENT: Annual cultural fest "TechSpectrum" will be held from Dec 15-17. Registrations open!',
        studentId: createdStudents[0].id,
        staffId: superAdmin.id
      },
      {
        content: 'IMPORTANT: College will remain closed tomorrow for maintenance work. All classes are postponed.',
        studentId: createdStudents[1].id,
        staffId: superAdmin.id
      },
      {
        content: 'Library will have extended hours during exams (8 AM - 10 PM). Make use of the facilities.',
        studentId: createdStudents[2].id,
        staffId: superAdmin.id
      }
    ];

    for (const messageData of messages) {
      await Message.create(messageData);
    }
    console.log('✅ Sample messages created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: admin@college.com / Admin@123');
    console.log('Staff 1: rajesh.kumar@college.com / Staff@123');
    console.log('Staff 2: priya.sharma@college.com / Staff@123');
    console.log('Staff 3: arjun.patel@college.com / Staff@123');
    console.log('Staff 4: sneha.reddy@college.com / Staff@123');
    console.log('Student 1: ranimeeranimee@gmail.com / Student@123');
    console.log('Student 2: cxndy.mee@gmail.com / Student@123');
    console.log('\n💡 All students have password: Student@123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedDatabase();