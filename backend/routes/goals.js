const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const GoalSheet = require('../models/GoalSheet');
const User = require('../models/User');

// @route   POST /api/goals
// @desc    Create a new goal for logged in user
// @access  Private
router.post('/', auth, async (req, res) => {
  try {

    const {
      title,
      description,
      thrustArea,
      uom,
      target,
      weightage,
      deadline,
      goalSheetId
    } = req.body;

    let sheetId = goalSheetId;

    // Find existing draft sheet
    if (!sheetId) {

      let sheet = await GoalSheet.findOne({
        employee: req.user.id,
        financialYear: 'FY2026'
      });

      // Create sheet if not exists
      if (!sheet) {

        const user = await User.findById(req.user.id);

        sheet = new GoalSheet({
          employee: req.user.id,
          manager: user?.managerId || req.user.id,
          financialYear: 'FY2026',
          status: 'Draft',
          totalWeightage: 0
        });

        await sheet.save();
      }

      sheetId = sheet._id;
    }

    // Allow only 3 goals
    const existingGoalCount = await Goal.countDocuments({
      owner: req.user.id,
      goalSheet: sheetId
    });

    if (existingGoalCount >= 3) {
      return res.status(400).json({
        message: 'Maximum of 3 goals allowed.'
      });
    }

    // Create new goal
    const newGoal = new Goal({
      title,
      description,
      thrustArea,
      uom,
      target,
      weightage,
      deadline,
      owner: req.user.id,
      goalSheet: sheetId
    });

    const goal = await newGoal.save();

    // Update total weightage
    const goalsInSheet = await Goal.find({
      goalSheet: sheetId
    });

    const totalWeightage = goalsInSheet.reduce(
      (sum, item) => sum + (item.weightage || 0),
      0
    );

    await GoalSheet.findByIdAndUpdate(sheetId, {
      totalWeightage
    });

    res.json(goal);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server Error'
    });
  }
});


// @route   GET /api/goals
// @desc    Get all goals for logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {

    const goals = await Goal.find({
      owner: req.user.id
    }).sort({ createdAt: -1 });

    res.json(goals);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server Error'
    });
  }
});


// @route   POST /api/goals/submit
// @desc    Submit goals to manager
// @access  Private
router.post('/submit', auth, async (req, res) => {
  try {

    // Get all user goals
    const goals = await Goal.find({
      owner: req.user.id
    });

    // Must have exactly 3 goals
    if (goals.length !== 3) {
      return res.status(400).json({
        message: 'You need exactly 3 goals before submission'
      });
    }

    // Get user's goalsheet
    const sheets = await GoalSheet.find({
      employee: req.user.id,
      financialYear: 'FY2026'
    });

    if (sheets.length === 0) {
      return res.status(400).json({
        message: 'No Goal Sheet found'
      });
    }

    await Goal.updateMany(
  { owner: req.user.id },
  {
    $set: {
      status: 'Pending Approval'
    }
  }
);

    // Submit all sheets
    for (let sheet of sheets) {

      sheet.status = 'Pending Approval';

      const user = await User.findById(req.user.id);

      if (user?.managerId) {
        sheet.manager = user.managerId;
      }

      await sheet.save();
    }

    res.json({
      message: 'Goals submitted successfully'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server Error'
    });
  }
});

module.exports = router;