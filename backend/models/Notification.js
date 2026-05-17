const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['GoalSubmitted', 'GoalApproved', 'GoalRejected', 'QuarterlyReminder', 'EscalationAlert', 'SharedGoalAssigned'],
    required: true
  },
  isRead: { type: Boolean, default: false },
  linkToEntity: { type: String } // Optional frontend route to navigate to
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
