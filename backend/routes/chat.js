const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workspace = require('../models/Message');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route   GET /api/chat
// @desc    Get chat history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Workspace.find()
      .populate('sender', 'fullName role')
      .sort({ createdAt: 1 })
      .limit(100); // Get last 100 messages
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Count unread workspace messages for the logged-in user
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Workspace.countDocuments({
      sender: { $ne: req.user.id },
      readBy: { $ne: req.user.id }
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/chat/mark-read
// @desc    Mark workspace messages as read for the logged-in user
// @access  Private
router.put('/mark-read', auth, async (req, res) => {
  try {
    await Workspace.updateMany(
      { sender: { $ne: req.user.id }, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ message: 'Workspace messages marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/chat/upload
// @desc    Upload media/audio file for chat
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Create the public URL for the file
    const fileUrl = `https://zenthra-dm3x.onrender.com/uploads/${req.file.filename}`;
    
    res.json({
      fileUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
