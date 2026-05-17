const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. "UPDATED_GOAL_TARGET"
  entityType: { type: String, required: true }, // e.g. "Goal"
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  oldValues: { type: mongoose.Schema.Types.Mixed },
  newValues: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
