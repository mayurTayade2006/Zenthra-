const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
  triggerType: {
    type: String,
    enum: ['GoalNotSubmitted', 'ApprovalPending', 'QuarterlyReviewIncomplete'],
    required: true
  },
  level: {
    type: Number,
    default: 1 // 1: Manager, 2: HR, 3: Admin
  },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Can be GoalSheet ID or QuarterlyCheckin ID
  isResolved: { type: Boolean, default: false },
  logs: [{
    action: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Escalation', escalationSchema);
