const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const MessageHandler = require('./MessageHandler');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// In-memory store
const rooms = new Map(); // roomId -> Room

const msgHandler = new MessageHandler(io, rooms);

// ─── REST Endpoints ──────────────────────────────────────────────────────────
app.get('/api/rooms', (req, res) => {
  const publicRooms = [];
  for (const room of rooms.values()) {
    if (!room.settings.isPrivate && room.game.phase === 'lobby' && !room.isFull()) {
      publicRooms.push(room.toPublicJSON());
    }
  }
  res.json({ rooms: publicRooms });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room: room.toJSON() });
});

app.get('/health', (req, res) => res.json({ status: 'ok', rooms: rooms.size }));

// ─── Socket.IO ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('create_room', (data, cb) => msgHandler.handleCreateRoom(socket, data, cb));
  socket.on('join_room', (data, cb) => msgHandler.handleJoinRoom(socket, data, cb));
  socket.on('get_public_rooms', (data, cb) => msgHandler.handleGetPublicRooms(socket, data, cb));
  socket.on('start_game', (data, cb) => msgHandler.handleStartGame(socket, data, cb));

  socket.on('draw_start', (data) => msgHandler.handleDrawStart(socket, data));
  socket.on('draw_move', (data) => msgHandler.handleDrawMove(socket, data));
  socket.on('draw_end', (data) => msgHandler.handleDrawEnd(socket, data));
  socket.on('canvas_clear', () => msgHandler.handleCanvasClear(socket));
  socket.on('draw_undo', () => msgHandler.handleDrawUndo(socket));

  socket.on('word_chosen', (data) => msgHandler.handleWordChosen(socket, data));
  socket.on('guess', (data) => msgHandler.handleGuess(socket, data));
  socket.on('chat', (data) => msgHandler.handleChat(socket, data));

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    msgHandler.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Skribbl Clone server running on port ${PORT}`);
});
