const mongoose = require('mongoose');

const quarterlyCheckinSchema = new mongoose.Schema({
  goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  quarter: { 
    type: String, 
    enum: ['Q1', 'Q2', 'Q3', 'Q4'], 
    required: true 
  },
  actualAchievement: { type: Number, required: true },
  statusUpdate: {
    type: String,
    enum: ['Not Started', 'On Track', 'At Risk', 'Delayed', 'Completed'],
    required: true
  },
  employeeNotes: { type: String },
  managerComments: { type: String },
  isReviewed: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure one check-in per goal per quarter
quarterlyCheckinSchema.index({ goal: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('QuarterlyCheckin', quarterlyCheckinSchema);
