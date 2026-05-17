const cron = require('node-cron');
const Goal = require('../models/Goal');
const QuarterlyCheckin = require('../models/QuarterlyCheckin');
const Escalation = require('../models/Escalation');
const Notification = require('../models/Notification');

// Define quarters logic (Simplified for demo: running everyday at midnight)
// In production, you'd run this specifically at the end of a quarter (e.g. March 31, June 30)

const runEscalationEngine = () => {
  console.log('⏳ Escalation Engine Initialized...');

  // Run at 00:00 every day to check for overdue check-ins
  // For Hackathon/Demo purposes, we might want to trigger it manually, but cron is setup here:
  cron.schedule('0 0 * * *', async () => {
    console.log('🔍 Running Scheduled Escalation Check...');
    try {
      // Find goals that are NOT completed
      const activeGoals = await Goal.find({ status: { $ne: 'Completed' } }).populate('owner');

      // Let's assume current active quarter to check is 'Q1' (this would be dynamic in production)
      const currentQuarterToCheck = 'Q1'; 

      for (let goal of activeGoals) {
        // Check if a quarterly check-in exists for this goal in this quarter
        const checkinExists = await QuarterlyCheckin.findOne({ 
          goal: goal._id, 
          quarter: currentQuarterToCheck 
        });

        if (!checkinExists) {
          // Escalation triggered!
          console.log(`⚠️ Escalation Triggered for Goal: ${goal.title} (User: ${goal.owner.fullName})`);

          // 1. Create Escalation Record
          const escalation = new Escalation({
            triggerType: 'QuarterlyReviewIncomplete',
            level: 1, // Start with Manager Level
            targetUser: goal.owner.managerId || goal.owner._id, // If no manager assigned, escalate to self/admin
            relatedEntityId: goal._id
          });
          await escalation.save();

          // 2. Fire Notification to Employee
          await Notification.create({
            user: goal.owner._id,
            title: 'Action Required: Missed Check-In',
            message: `You missed the ${currentQuarterToCheck} check-in for goal "${goal.title}". This has been escalated.`,
            type: 'QuarterlyReminder'
          });

          // 3. Fire Notification to Manager
          if (goal.owner.managerId) {
            await Notification.create({
              user: goal.owner.managerId,
              title: 'Escalation Alert',
              message: `Employee ${goal.owner.fullName} missed their ${currentQuarterToCheck} check-in.`,
              type: 'EscalationAlert'
            });
          }
        }
      }
      console.log('✅ Escalation Check Complete.');
    } catch (err) {
      console.error('❌ Escalation Engine Error:', err);
    }
  });
};

module.exports = runEscalationEngine;
