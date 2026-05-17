require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"]
  }
});

const Workspace = require('./models/Message');
const User = require('./models/User');

io.on('connection', (socket) => {
  console.log('A user connected to the workspace chat:', socket.id);

  socket.on('sendMessage', async (data) => {
    try {
      // data expects: { userId, text }
      const user = await User.findById(data.userId);
      if (user && (data.text || data.fileUrl)) {
        // Save to DB
        const newMessage = new Workspace({ 
          sender: user._id, 
          text: data.text || '', 
          fileUrl: data.fileUrl, 
          fileType: data.fileType, 
          fileName: data.fileName,
          readBy: [user._id]
        });
        await newMessage.save();

        // Broadcast to everyone including sender
        io.emit('receiveMessage', {
          _id: newMessage._id,
          text: newMessage.text,
          fileUrl: newMessage.fileUrl,
          fileType: newMessage.fileType,
          fileName: newMessage.fileName,
          createdAt: newMessage.createdAt,
          sender: {
            _id: user._id,
            fullName: user.fullName,
            role: user.role
          }
        });
      }
    } catch (err) {
      console.error('Socket error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('Zenthra Enterprise API is running');
});

// Initialize Background Escalation Engine
const runEscalationEngine = require('./services/cron');
runEscalationEngine();

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zenthra')
    .then(() => {
        console.log('MongoDB connected successfully to Zenthra database');
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('MongoDB connection error:', err));
