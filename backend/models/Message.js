const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: false // Optional if it's just a file
  },
  fileUrl: {
    type: String
  },
  fileType: {
    type: String // 'image', 'audio', 'document'
  },
  fileName: {
    type: String
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Workspace', messageSchema, 'workspaces');
