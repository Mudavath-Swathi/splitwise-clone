const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const commentRoutes = require('./routes/comments');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://splitwise-clone-tawny.vercel.app',
      process.env.FRONTEND_URL
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://splitwise-clone-tawny.vercel.app',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => res.json({ message: 'SplitMate API running ✅' }));

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_expense', (expenseId) => {
    socket.join(`expense_${expenseId}`);
  });

  socket.on('send_message', (data) => {
    io.to(`expense_${data.expenseId}`).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { io };