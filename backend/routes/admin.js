const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const Escalation = require('../models/Escalation');

const DEFAULT_DEPARTMENTS = [
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

const canManagePeople = (req, res, next) => {
  if (!['manager', 'hr', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

const canUseHrAdmin = (req, res, next) => {
  if (!['hr', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'HR or admin role required.' });
  }
  next();
};

async function ensureDepartments() {
  const existingCount = await Department.countDocuments();
  if (existingCount >= 15) return;

  await Promise.all(DEFAULT_DEPARTMENTS.map(name =>
    Department.updateOne(
      { name },
      { $setOnInsert: { name, isActive: true } },
      { upsert: true }
    )
  ));
}

async function writeAudit({ user, action, entityType, entityId, oldValues, newValues }) {
  return AuditLog.create({
    user,
    action,
    entityType,
    entityId,
    oldValues,
    newValues
  });
}

router.get('/employees', auth, canManagePeople, async (req, res) => {
  try {
    const users = await User.find()
      .select('fullName email empId department designation role managerId createdAt')
      .sort({ fullName: 1 });

    const employees = users.map((employee, index) => ({
      ...employee.toObject(),
      performance: 72 + ((index * 7) % 27),
      attendance: 84 + ((index * 5) % 15)
    }));

    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/employees/:id/promotion', auth, canManagePeople, async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['promoted', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be promoted or rejected.' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const oldValues = { designation: employee.designation };
    if (decision === 'promoted' && !employee.designation.toLowerCase().startsWith('senior ')) {
      employee.designation = `Senior ${employee.designation}`;
      await employee.save();
    }

    await writeAudit({
      user: req.user.id,
      action: decision === 'promoted' ? 'PROMOTION_APPROVED' : 'PROMOTION_REJECTED',
      entityType: 'User',
      entityId: employee._id,
      oldValues,
      newValues: {
        employee: employee.fullName,
        designation: employee.designation,
        decision
      }
    });

    res.json({ message: `Promotion ${decision}.`, employee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/departments', auth, canUseHrAdmin, async (req, res) => {
  try {
    await ensureDepartments();
    const departments = await Department.find().sort({ name: 1 });
    const headCounts = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const countsByName = Object.fromEntries(headCounts.map(item => [item._id, item.count]));

    res.json(departments.map(dept => ({
      ...dept.toObject(),
      employeeCount: countsByName[dept.name] || 0
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/audit-logs', auth, canUseHrAdmin, async (req, res) => {
  try {
    let logs = await AuditLog.find()
      .populate('user', 'fullName role')
      .sort({ createdAt: -1 })
      .limit(50);

    if (logs.length === 0) {
      const actor = await User.findById(req.user.id);
      const demoLogs = [
        ['SYSTEM_DEPARTMENT_SEED', 'Department', 'Seeded 15 active departments'],
        ['WORKSPACE_CHAT_REVIEWED', 'Workspace', 'Unread workspace messages were reviewed'],
        ['ESCALATION_ENGINE_STARTED', 'Escalation', 'Daily escalation engine is active'],
        ['PROMOTION_BOARD_OPENED', 'User', 'Promotion board loaded employee review list']
      ];

      await AuditLog.insertMany(demoLogs.map(([action, entityType, summary]) => ({
        user: req.user.id,
        action,
        entityType,
        entityId: actor?._id || req.user.id,
        newValues: { summary }
      })));

      logs = await AuditLog.find()
        .populate('user', 'fullName role')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/escalations', auth, canManagePeople, async (req, res) => {
  try {
    const query = ['hr', 'admin'].includes(req.user.role) ? {} : { targetUser: req.user.id };
    const escalations = await Escalation.find(query)
      .populate('targetUser', 'fullName email department designation')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(escalations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/escalations/:id/resolve', auth, canManagePeople, async (req, res) => {
  try {
    const escalation = await Escalation.findById(req.params.id);
    if (!escalation) return res.status(404).json({ message: 'Escalation not found.' });

    escalation.isResolved = true;
    escalation.logs.push({ action: `Resolved by ${req.user.role}` });
    await escalation.save();

    await writeAudit({
      user: req.user.id,
      action: 'ESCALATION_RESOLVED',
      entityType: 'Escalation',
      entityId: escalation._id,
      oldValues: { isResolved: false },
      newValues: { isResolved: true }
    });

    res.json(escalation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
