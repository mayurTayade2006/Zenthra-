const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  thrustArea: { type: String, required: true },
  uom: { 
    type: String, 
    enum: ['Numeric', 'Percentage', 'Timeline', 'Zero-based'], 
    required: true 
  },

  status: {
   type: String,
   default: 'Draft'
},

  target: { type: Number, required: true },
  weightage: { type: Number, required: true, min: 10 },
  deadline: { type: Date, required: true },
  
  // Progress tracking
  achieved: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Not Started', 'On Track', 'At Risk', 'Delayed', 'Completed'],
    default: 'Not Started'
  },
  
  // Relations
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goalSheet: { type: mongoose.Schema.Types.ObjectId, ref: 'GoalSheet', required: true },
  
  // Shared Goal Logic
  isShared: { type: Boolean, default: false },
  parentGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
