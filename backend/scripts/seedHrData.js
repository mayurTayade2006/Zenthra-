require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');

const departments = [
  'Product Department',
  'Engineering Department',
  'Frontend Team',
  'Backend Team',
  'AI Research Team',
  'Data Science Department',
  'Cloud Operations',
  'Quality Assurance',
  'Cybersecurity',
  'Human Resources',
  'Finance Department',
  'Sales Department',
  'Marketing Department',
  'Customer Success',
  'Legal and Compliance'
];

const employees = [
  ['Aarav Sharma', 'EMP1001', 'Product Department', 'Product Analyst', 'employee'],
  ['Vivaan Patel', 'EMP1002', 'Engineering Department', 'Software Engineer', 'employee'],
  ['Aditya Iyer', 'EMP1003', 'Frontend Team', 'Frontend Developer', 'employee'],
  ['Arjun Mehta', 'EMP1004', 'Backend Team', 'Backend Developer', 'employee'],
  ['Sai Verma', 'EMP1005', 'AI Research Team', 'AI Engineer', 'employee'],
  ['Reyansh Kulkarni', 'EMP1006', 'Data Science Department', 'Data Analyst', 'employee'],
  ['Krishna Nair', 'EMP1007', 'Cloud Operations', 'Cloud Engineer', 'employee'],
  ['Ishaan Reddy', 'EMP1008', 'Quality Assurance', 'QA Engineer', 'employee'],
  ['Kabir Bansal', 'EMP1009', 'Cybersecurity', 'Security Analyst', 'employee'],
  ['Ananya Deshmukh', 'EMP1010', 'Human Resources', 'HR Executive', 'hr'],
  ['Diya Joshi', 'EMP1011', 'Finance Department', 'Finance Associate', 'employee'],
  ['Saanvi Rao', 'EMP1012', 'Sales Department', 'Sales Executive', 'employee'],
  ['Myra Chatterjee', 'EMP1013', 'Marketing Department', 'Marketing Specialist', 'employee'],
  ['Aadhya Singh', 'EMP1014', 'Customer Success', 'Customer Success Associate', 'employee'],
  ['Riya Malhotra', 'EMP1015', 'Legal and Compliance', 'Compliance Associate', 'employee'],
  ['Nisha Menon', 'EMP1016', 'Engineering Department', 'Engineering Manager', 'manager'],
  ['Karan Kapoor', 'EMP1017', 'Product Department', 'Product Manager', 'manager'],
  ['Rohan Gupta', 'EMP1018', 'Backend Team', 'Senior Backend Engineer', 'employee'],
  ['Meera Krishnan', 'EMP1019', 'Data Science Department', 'Machine Learning Engineer', 'employee'],
  ['Priya Shah', 'EMP1020', 'Human Resources', 'HR Admin', 'admin']
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zenthra');

  await Promise.all(departments.map(name =>
    Department.updateOne(
      { name },
      { $setOnInsert: { name, isActive: true } },
      { upsert: true }
    )
  ));

  const existingUsers = await User.find().sort({ createdAt: 1 });

  for (let index = 0; index < employees.length; index += 1) {
    const [fullName, empId, department, designation, role] = employees[index];
    const update = {
      fullName,
      email: `${empId.toLowerCase()}@zenthra.in`,
      empId,
      department,
      designation,
      role,
      managerId: null
    };

    const existing = existingUsers[index];
    if (existing) {
      await User.updateOne({ _id: existing._id }, { $set: update });
    } else {
      await User.create({ ...update, password: 'Password@123' });
    }
  }

  const primaryManager = await User.findOne({ empId: 'EMP1016' });
  await User.updateMany(
    { empId: { $in: employees.filter(item => item[4] === 'employee').map(item => item[1]) } },
    { $set: { managerId: primaryManager._id } }
  );

  const extraUsers = await User.find().sort({ createdAt: 1 }).skip(employees.length);
  if (extraUsers.length) {
    for (const user of extraUsers) {
      const department = departments[Math.floor(Math.random() * departments.length)];
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            fullName: user.fullName || 'Zenthra Employee',
            department,
            designation: user.designation || 'Associate',
            managerId: user.role === 'employee' ? primaryManager._id : null
          }
        }
      );
    }
  }

  await AuditLog.create({
    user: primaryManager._id,
    action: 'HR_EMPLOYEE_DATA_SEEDED',
    entityType: 'User',
    entityId: primaryManager._id,
    newValues: {
      summary: 'Seeded 20 Indian employee profiles and mapped each employee to a department.'
    }
  });

  console.log('Seeded 20 Indian employees and 15 departments successfully.');
  console.log('Sample login IDs: EMP1016 as manager, EMP1010 as HR, EMP1020 as admin, EMP1001 as employee.');
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
