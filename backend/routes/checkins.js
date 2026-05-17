const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const QuarterlyCheckin = require('../models/QuarterlyCheckin');
const Goal = require('../models/Goal');

// @route   POST /api/checkins/:goalId
// @desc    Create a quarterly checkin for a goal
// @access  Private
router.post('/:goalId', auth, async (req, res) => {
  try {
    const { quarter, actualAchievement, statusUpdate, employeeNotes } = req.body;
    const goalId = req.params.goalId;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    // Validate ownership
    if (goal.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const checkin = new QuarterlyCheckin({
      goal: goalId,
      quarter,
      actualAchievement,
      statusUpdate,
      employeeNotes
    });

    await checkin.save();

    // Update the goal progress based on Checkin
    goal.achieved = actualAchievement;
    goal.status = statusUpdate;
    
    // Calculate percentage based on Min/Max logic
    let percentage = (actualAchievement / goal.target) * 100;
    if (percentage > 100) percentage = 100;
    
    goal.completionPercentage = Math.round(percentage);
    await goal.save();

    res.json(checkin);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Check-in already submitted for this quarter' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
