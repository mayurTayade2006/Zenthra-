const mongoose = require('mongoose');

const goalSheetSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  financialYear: { type: String, required: true },
  
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Rework Requested'],
    default: 'Draft'
  },
  
  totalWeightage: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  
  managerComments: [{
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('GoalSheet', goalSheetSchema);
