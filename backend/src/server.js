const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"]
  }
});

// Store shapes for each room
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected');
  
  // Extract room ID from the URL
  const roomId = socket.handshake.query.roomId;
  socket.join(roomId);

  // Initialize room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, []);
  }

  // Send existing shapes to the new user
  socket.emit('initialShapes', rooms.get(roomId));

  // Handle new drawings
  socket.on('draw', (shape) => {
    const roomShapes = rooms.get(roomId);
    roomShapes.push(shape);
    socket.to(roomId).emit('draw', shape);
  });

  // Handle cursor movement
  socket.on('cursorMove', (data) => {
    socket.to(roomId).emit('cursorMove', {
      ...data,
      userId: socket.id
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
    io.to(roomId).emit('userDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
