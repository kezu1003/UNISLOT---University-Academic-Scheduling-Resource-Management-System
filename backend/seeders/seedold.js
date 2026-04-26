const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import Models
const User = require('../models/User');
const Staff = require('../models/Staff');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const Hall = require('../models/Hall');

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// ================= USERS =================
const users = [
  {
    name: 'Admin User',
    email: 'admin@sliit.lk',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Dr. John Smith',
    email: 'lic@sliit.lk',
    password: 'lic123',
    role: 'lic'
  },
  {
    name: 'Sarah Johnson',
    email: 'coord@sliit.lk',
    password: 'coord123',
    role: 'coordinator'
  }
];

// ================= STAFF =================
const staffMembers = [
  {
    staffId: 'ST001',
    name: 'Dr. John Smith',
    email: 'john.smith@sliit.lk',
    priority: 1,
    specialization: ['IT', 'SE'],
    location: 'Malabe',
    maxWorkload: 20,
    currentWorkload: 12
  },
  {
    staffId: 'ST002',
    name: 'Prof. Mary Williams',
    email: 'mary.williams@sliit.lk',
    priority: 2,
    specialization: ['DS', 'IT'],
    location: 'Malabe',
    maxWorkload: 18,
    currentWorkload: 15
  },
  {
    staffId: 'ST003',
    name: 'Dr. James Brown',
    email: 'james.brown@sliit.lk',
    priority: 3,
    specialization: ['CYBER', 'CS'],
    location: 'Malabe',
    maxWorkload: 20,
    currentWorkload: 8
  }
];

// ================= BATCHES =================
const batches = [
  { batchCode: 'Y1.S1.WD.IT.01.01', year: 1, semester: 1, type: 'WD', specialization: 'IT', mainGroup: '01', subGroup: '01', studentCount: 45 },
  { batchCode: 'Y2.S1.WD.IT.01.01', year: 2, semester: 1, type: 'WD', specialization: 'IT', mainGroup: '01', subGroup: '01', studentCount: 40 }
];

// ================= HALLS =================
const halls = [
  { hallCode: 'A501', hallName: 'Lecture Hall A501', capacity: 150, location: 'Malabe', type: 'Lecture Hall' },
  { hallCode: 'B301', hallName: 'Computer Lab B301', capacity: 50, location: 'Malabe', type: 'Lab' }
];

// ================= COURSES =================
const courses = [
  { courseCode: 'IT1010', courseName: 'Introduction to Programming', credits: 4, lectureHours: 2, tutorialHours: 1, labHours: 2, year: 1, semester: 1, specialization: ['IT', 'SE'] },
  { courseCode: 'IT2030', courseName: 'Data Structures', credits: 4, lectureHours: 3, tutorialHours: 1, labHours: 1, year: 2, semester: 1, specialization: ['IT'] }
];

// ================= SEED FUNCTION =================
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    await User.deleteMany({});
    await Staff.deleteMany({});
    await Batch.deleteMany({});
    await Course.deleteMany({});
    await Hall.deleteMany({});

    console.log('✅ Cleared existing data');

    // ✅ Create Users (IMPORTANT: use create() not insertMany)
    const createdUsers = [];

    for (let userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    console.log(`✅ Created ${createdUsers.length} users`);

    // ✅ Get LIC user from User collection
    const licUser = createdUsers.find(u => u.role === 'lic');

    // Create Staff
    const createdStaff = await Staff.insertMany(staffMembers);
    console.log(`✅ Created ${createdStaff.length} staff members`);

    const licStaff = createdStaff.find((s) => s.staffId === 'ST001') || createdStaff[0];
    await User.findByIdAndUpdate(licUser._id, { staff: licStaff._id });
    console.log('✅ Linked LIC user to staff record');

    // Create Batches
    const createdBatches = await Batch.insertMany(batches);
    console.log(`✅ Created ${createdBatches.length} batches`);

    // Create Halls
    const createdHalls = await Hall.insertMany(halls);
    console.log(`✅ Created ${createdHalls.length} halls`);

    const coursesWithLIC = courses.map((course) => ({
      ...course,
      lic: licStaff._id
    }));

    await Course.insertMany(coursesWithLIC);
    console.log(`✅ Created ${courses.length} courses with LIC assigned`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Admin: admin@sliit.lk / admin123');
    console.log('   LIC: lic@sliit.lk / lic123');
    console.log('   Coordinator: coord@sliit.lk / coord123\n');

    process.exit();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();