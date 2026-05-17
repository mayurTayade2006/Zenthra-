const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const User = require('../models/User');
const GoalSheet = require('../models/GoalSheet');
const Escalation = require('../models/Escalation');

// @route   GET /api/analytics
// @desc    Get dashboard analytics based on role
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { role, id } = req.user;
    
    let stats = {
      totalGoals: 0,
      avgCompletion: 0,
      pendingApprovals: 0,
      escalations: 0,
      statusData: [
        { name: 'On Track', value: 0 },
        { name: 'At Risk', value: 0 },
        { name: 'Delayed', value: 0 },
        { name: 'Completed', value: 0 },
        { name: 'Not Started', value: 0 }
      ],
      departmentData: []
    };

    let goals = [];
    if (role === 'employee') {
      goals = await Goal.find({ owner: id });
    } else if (role === 'manager') {
      const sheets = await GoalSheet.find({ manager: id });
      const sheetIds = sheets.map(s => s._id);
      goals = await Goal.find({ goalSheet: { $in: sheetIds } });
      stats.pendingApprovals = sheets.filter(s => s.status !== 'Approved').length;
      stats.escalations = await Escalation.countDocuments({ targetUser: id });
    } else {
      // HR/Admin sees everything
      goals = await Goal.find({});
      stats.pendingApprovals = await GoalSheet.countDocuments({ status: { $ne: 'Approved' } });
      stats.escalations = await Escalation.countDocuments();
      
      // Calculate department data
      const depts = await User.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } }
      ]);
      stats.departmentData = depts.map(d => ({ name: d._id, active: d.count, completion: Math.floor(Math.random() * 40) + 60 })); // Mock completion for now
    }

    stats.totalGoals = goals.length;
    if (stats.totalGoals > 0) {
      const totalPercentage = goals.reduce((acc, g) => acc + (g.completionPercentage || 0), 0);
      stats.avgCompletion = Math.round(totalPercentage / stats.totalGoals);
      
      goals.forEach(g => {
        const stat = stats.statusData.find(s => s.name === g.status);
        if (stat) stat.value++;
      });
    }

    // Filter out 0 value status
    stats.statusData = stats.statusData.filter(s => s.value > 0);
    if (stats.statusData.length === 0) stats.statusData = [{ name: 'No Goals', value: 1 }];

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
