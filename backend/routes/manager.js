const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GoalSheet = require('../models/GoalSheet');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Middleware to ensure user is manager or admin
const isManager = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Manager role required.' });
  }
  next();
};

// @route   GET /api/manager/teamsheets
// @desc    Get all goal sheets pending approval for this manager
// @access  Private (Manager+)
router.get('/teamsheets', auth, isManager, async (req, res) => {
  try {
    const sheets = await GoalSheet.find({ manager: req.user.id })
      .populate('employee', 'fullName email empId')
      .sort({ updatedAt: -1 });

    // Fetch goals for each sheet to display to manager
    const sheetsWithGoals = await Promise.all(sheets.map(async (sheet) => {
      const goals = await Goal.find({ goalSheet: sheet._id });
      return { ...sheet._doc, goals };
    }));

    res.json(sheetsWithGoals);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/manager/analytics
// @desc    Get live manager team analytics
// @access  Private (Manager+)
router.get('/analytics', auth, isManager, async (req, res) => {
  try {
    const teamMembers = await User.find({ managerId: req.user.id })
      .select('fullName department designation role');

    const sheets = await GoalSheet.find({ manager: req.user.id }).populate('employee', 'fullName department');
    const goals = await Goal.find({ goalSheet: { $in: sheets.map(sheet => sheet._id) } });

    const departmentMap = new Map();
    teamMembers.forEach(member => {
      const current = departmentMap.get(member.department) || { name: member.department, employees: 0, completionTotal: 0, goals: 0 };
      current.employees += 1;
      departmentMap.set(member.department, current);
    });

    goals.forEach(goal => {
      const sheet = sheets.find(item => item._id.toString() === goal.goalSheet.toString());
      const deptName = sheet?.employee?.department || 'Unassigned';
      const current = departmentMap.get(deptName) || { name: deptName, employees: 0, completionTotal: 0, goals: 0 };
      current.completionTotal += goal.completionPercentage || 0;
      current.goals += 1;
      departmentMap.set(deptName, current);
    });

    const departmentPerformance = Array.from(departmentMap.values()).map(item => ({
      name: item.name,
      employees: item.employees,
      completion: item.goals ? Math.round(item.completionTotal / item.goals) : 0,
      goals: item.goals
    }));

    const statusCounts = goals.reduce((acc, goal) => {
      acc[goal.status] = (acc[goal.status] || 0) + 1;
      return acc;
    }, {});

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const avgCompletion = goals.length
      ? Math.round(goals.reduce((sum, goal) => sum + (goal.completionPercentage || 0), 0) / goals.length)
      : 0;

    res.json({
      activeEmployees: teamMembers.length,
      teamEfficiency: avgCompletion,
      goalSheets: sheets.length,
      pendingApprovals: sheets.filter(sheet => sheet.status !== 'Approved').length,
      totalGoals: goals.length,
      departmentPerformance,
      statusData: statusData.length ? statusData : [{ name: 'No Goals', value: 1 }]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/manager/teamsheets/:id/approve
// @desc    Approve or Reject a Goal Sheet
// @access  Private (Manager+)


router.get('/submitted-goals', auth, async (req, res) => {
  try {

    const goals = await Goal.find({
      status: 'Pending Approval'
    }).populate('owner', 'name email department');

    res.json(goals);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Server Error'
    });

  }
});


router.put('/teamsheets/:id/approve', auth, isManager, async (req, res) => {
  try {
    const { status, comments } = req.body; // status: 'Approved' or 'Rework Requested'
    
    if (!['Approved', 'Rework Requested'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    let sheet = await GoalSheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Goal Sheet not found' });
    
    if (sheet.manager.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to approve this sheet' });
    }

    sheet.status = status;
    if (status === 'Approved') sheet.isLocked = true;
    
    if (comments) {
      sheet.managerComments.push({ text: comments, createdAt: new Date() });
    }
    
    await sheet.save();

    // Notify employee
    await Notification.create({
      user: sheet.employee,
      title: `Goal Sheet ${status}`,
      message: `Your manager has ${status.toLowerCase()} your FY2026 Goal Sheet.`,
      type: status === 'Approved' ? 'GoalApproved' : 'GoalRejected'
    });

    res.json(sheet);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
