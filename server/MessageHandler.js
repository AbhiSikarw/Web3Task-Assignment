class MessageHandler {
  constructor(io, rooms) {
    this.io = io;
    this.rooms = rooms; // Map<roomId, Room>
  }

  // ─── Room & Lobby ──────────────────────────────────────────────────────────

  handleCreateRoom(socket, { hostName, settings }, callback) {
    const Room = require('./Room');
    const playerId = socket.id;
    const room = new Room(playerId, hostName, socket.id, settings);
    this.rooms.set(room.id, room);
    socket.join(room.id);
    socket.roomId = room.id;
    socket.playerId = playerId;

    console.log(`Room created: ${room.id} by ${hostName}`);
    callback({ success: true, roomId: room.id, playerId, player: room.getPlayer(playerId).toJSON() });
  }

  handleJoinRoom(socket, { roomId, playerName }, callback) {
    const room = this.rooms.get(roomId);
    if (!room) return callback({ success: false, error: 'Room not found' });
    if (room.isFull()) return callback({ success: false, error: 'Room is full' });
    if (room.game.phase !== 'lobby') return callback({ success: false, error: 'Game already in progress' });

    const playerId = socket.id;
    const player = room.addPlayer(playerId, playerName, socket.id);
    if (!player) return callback({ success: false, error: 'Could not join room' });

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerId = playerId;

    // Notify all others
    this.io.to(roomId).emit('player_joined', {
      player: player.toJSON(),
      players: room.getPlayersArray()
    });

    console.log(`${playerName} joined room ${roomId}`);
    callback({
      success: true,
      roomId,
      playerId,
      player: player.toJSON(),
      room: room.toJSON()
    });
  }

  handleGetPublicRooms(socket, _, callback) {
    const publicRooms = [];
    for (const room of this.rooms.values()) {
      if (!room.settings.isPrivate && room.game.phase === 'lobby' && !room.isFull()) {
        publicRooms.push(room.toPublicJSON());
      }
    }
    callback({ rooms: publicRooms });
  }

  handleStartGame(socket, _, callback) {
    const room = this.rooms.get(socket.roomId);
    if (!room) return callback?.({ success: false, error: 'Room not found' });
    if (socket.playerId !== room.hostId) return callback?.({ success: false, error: 'Only host can start' });
    if (!room.canStart()) return callback?.({ success: false, error: 'Need at least 2 players' });

    room.startGame();
    room.startNewRound();

    const drawer = room.game.getCurrentDrawer();
    const wordOptions = room.game.wordOptions;

    // Send word options only to drawer
    const drawerSocket = this.io.sockets.sockets.get(drawer.socketId);
    if (drawerSocket) {
      drawerSocket.emit('round_start', {
        drawerId: drawer.id,
        wordOptions: wordOptions,
        drawTime: room.settings.drawTime,
        round: room.game.currentRound,
        totalRounds: room.settings.rounds
      });
    }

    // Tell everyone else who's drawing (no word options)
    socket.to(room.id).emit('round_start', {
      drawerId: drawer.id,
      wordOptions: null,
      drawTime: room.settings.drawTime,
      round: room.game.currentRound,
      totalRounds: room.settings.rounds
    });

    // Update game state
    this.io.to(room.id).emit('game_state', {
      phase: 'word_selection',
      round: room.game.currentRound,
      totalRounds: room.settings.rounds,
      drawerId: drawer.id,
      players: room.getPlayersArray()
    });

    callback?.({ success: true });
  }

  // ─── Drawing ───────────────────────────────────────────────────────────────

  handleDrawStart(socket, data) {
    const room = this.rooms.get(socket.roomId);
    if (!room || room.game.phase !== 'drawing') return;
    const drawer = room.game.getCurrentDrawer();
    if (drawer?.id !== socket.playerId) return;

    const strokeData = { type: 'start', ...data };
    room.game.addStroke(strokeData);
    socket.to(room.id).emit('draw_data', strokeData);
  }

  handleDrawMove(socket, data) {
    const room = this.rooms.get(socket.roomId);
    if (!room || room.game.phase !== 'drawing') return;
    const drawer = room.game.getCurrentDrawer();
    if (drawer?.id !== socket.playerId) return;

    const strokeData = { type: 'move', ...data };
    room.game.addStroke(strokeData);
    socket.to(room.id).emit('draw_data', strokeData);
  }

  handleDrawEnd(socket, data) {
    const room = this.rooms.get(socket.roomId);
    if (!room || room.game.phase !== 'drawing') return;
    const drawer = room.game.getCurrentDrawer();
    if (drawer?.id !== socket.playerId) return;

    const strokeData = { type: 'end', ...data };
    room.game.addStroke(strokeData);
    socket.to(room.id).emit('draw_data', strokeData);
  }

  handleCanvasClear(socket) {
    const room = this.rooms.get(socket.roomId);
    if (!room) return;
    const drawer = room.game.getCurrentDrawer();
    if (drawer?.id !== socket.playerId) return;

    room.game.clearCanvas();
    this.io.to(room.id).emit('canvas_clear');
  }

  handleDrawUndo(socket) {
    const room = this.rooms.get(socket.roomId);
    if (!room) return;
    const drawer = room.game.getCurrentDrawer();
    if (drawer?.id !== socket.playerId) return;

    room.game.undoLastStroke();
    this.io.to(room.id).emit('draw_undo', { strokes: room.game.canvasStrokes });
  }

  // ─── Word Selection ────────────────────────────────────────────────────────

  handleWordChosen(socket, { word }) {
    const room = this.rooms.get(socket.roomId);
    if (!room) return;
    const drawer = room.game.getCurrentDrawer();
    if (drawer?.id !== socket.playerId) return;

    const success = room.game.chooseWord(word);
    if (!success) return;

    // Tell everyone the word is chosen (not the word itself for non-drawers)
    const wordLength = word.split(' ').map(w => w.length);
    this.io.to(room.id).emit('game_state', {
      phase: 'drawing',
      round: room.game.currentRound,
      totalRounds: room.settings.rounds,
      drawerId: drawer.id,
      wordLength,
      hint: room.game.getHintString(0),
      timeLeft: room.settings.drawTime,
      players: room.getPlayersArray()
    });

    // Start timer
    this.startRoundTimer(room);
  }

  // ─── Guessing & Chat ───────────────────────────────────────────────────────

  handleGuess(socket, { text }) {
    const room = this.rooms.get(socket.roomId);
    if (!room || room.game.phase !== 'drawing') return;

    const player = room.getPlayer(socket.playerId);
    if (!player) return;

    // Drawer can't guess
    const drawer = room.game.getCurrentDrawer();
    if (drawer?.id === socket.playerId) return;

    // Already guessed correctly
    if (player.hasGuessedCorrectly) return;

    const isCorrect = room.game.checkGuess(text);

    if (isCorrect) {
      player.hasGuessedCorrectly = true;
      const points = room.game.calculatePoints(
        room.game.timeLeft,
        room.settings.drawTime,
        room.correctGuessersThisRound
      );
      player.addScore(points);
      room.correctGuessersThisRound++;

      // Give drawer points too
      const drawerPlayer = room.getPlayer(drawer.id);
      if (drawerPlayer) drawerPlayer.addScore(50);

      this.io.to(room.id).emit('guess_result', {
        correct: true,
        playerId: socket.playerId,
        playerName: player.name,
        points
      });

      this.io.to(room.id).emit('players_update', { players: room.getPlayersArray() });

      // Check if all non-drawers guessed correctly
      const nonDrawers = Array.from(room.players.values()).filter(p => p.id !== drawer.id);
      const allGuessed = nonDrawers.every(p => p.hasGuessedCorrectly);
      if (allGuessed) {
        this.endRound(room);
      }
    } else {
      // Show guess as chat message (masked slightly)
      const maskedText = text.length > 0 ? text : '...';
      this.io.to(room.id).emit('chat_message', {
        playerId: socket.playerId,
        playerName: player.name,
        text: maskedText,
        isGuess: true,
        isClose: this.isClose(text, room.game.currentWord)
      });
    }
  }

  isClose(guess, word) {
    if (!word || !guess) return false;
    const g = guess.trim().toLowerCase();
    const w = word.toLowerCase();
    if (Math.abs(g.length - w.length) > 2) return false;
    let diff = 0;
    const minLen = Math.min(g.length, w.length);
    for (let i = 0; i < minLen; i++) {
      if (g[i] !== w[i]) diff++;
    }
    diff += Math.abs(g.length - w.length);
    return diff <= 2;
  }

  handleChat(socket, { text }) {
    const room = this.rooms.get(socket.roomId);
    if (!room) return;
    const player = room.getPlayer(socket.playerId);
    if (!player) return;

    // During drawing phase, drawer can send chat but not guesses
    this.io.to(room.id).emit('chat_message', {
      playerId: socket.playerId,
      playerName: player.name,
      text,
      isGuess: false,
      isClose: false
    });
  }

  // ─── Round & Timer Logic ───────────────────────────────────────────────────

  startRoundTimer(room) {
    let timeLeft = room.settings.drawTime;
    room.game.timeLeft = timeLeft;

    const totalHints = room.settings.hints;
    const hintInterval = totalHints > 0 ? Math.floor(room.settings.drawTime / (totalHints + 1)) : 0;
    let hintsGiven = 0;

    clearInterval(room.game.timer);

    room.game.timer = setInterval(() => {
      timeLeft--;
      room.game.timeLeft = timeLeft;

      // Emit timer tick
      this.io.to(room.id).emit('timer_tick', { timeLeft });

      // Give hints at intervals
      if (hintInterval > 0 && hintsGiven < totalHints) {
        const elapsed = room.settings.drawTime - timeLeft;
        if (elapsed >= hintInterval * (hintsGiven + 1)) {
          hintsGiven++;
          room.game.hintsRevealed = hintsGiven;
          const hint = room.game.revealNextHint();
          this.io.to(room.id).emit('hint_update', { hint, hintsRevealed: hintsGiven });
        }
      }

      if (timeLeft <= 0) {
        this.endRound(room);
      }
    }, 1000);
  }

  endRound(room) {
    clearInterval(room.game.timer);
    room.game.timer = null;
    room.game.endRound();

    const word = room.game.currentWord;
    const scores = room.getLeaderboard();

    this.io.to(room.id).emit('round_end', {
      word,
      scores,
      players: room.getPlayersArray()
    });

    // Wait 5 seconds then start next round
    setTimeout(() => {
      this.advanceToNextRound(room);
    }, 5000);
  }

  advanceToNextRound(room) {
    const players = Array.from(room.players.values());
    const gameOver = !room.game.advanceToNextDrawer(players);

    if (gameOver) {
      const winner = room.getWinner();
      const leaderboard = room.getLeaderboard();
      this.io.to(room.id).emit('game_over', { winner, leaderboard });
      return;
    }

    room.startNewRound();
    const drawer = room.game.getCurrentDrawer();
    if (!drawer) return;

    const drawerSocket = this.io.sockets.sockets.get(drawer.socketId);
    if (drawerSocket) {
      drawerSocket.emit('round_start', {
        drawerId: drawer.id,
        wordOptions: room.game.wordOptions,
        drawTime: room.settings.drawTime,
        round: room.game.currentRound,
        totalRounds: room.settings.rounds
      });
    }

    socket_to_room: {
      this.io.to(room.id).emit('round_start', {
        drawerId: drawer.id,
        wordOptions: null,
        drawTime: room.settings.drawTime,
        round: room.game.currentRound,
        totalRounds: room.settings.rounds
      });
    }

    this.io.to(room.id).emit('game_state', {
      phase: 'word_selection',
      round: room.game.currentRound,
      totalRounds: room.settings.rounds,
      drawerId: drawer.id,
      players: room.getPlayersArray()
    });
  }

  handleDisconnect(socket) {
    const room = this.rooms.get(socket.roomId);
    if (!room) return;

    const player = room.getPlayer(socket.playerId);
    room.removePlayer(socket.playerId);

    if (room.isEmpty()) {
      clearInterval(room.game.timer);
      this.rooms.delete(room.id);
      console.log(`Room ${room.id} deleted (empty)`);
      return;
    }

    this.io.to(room.id).emit('player_left', {
      playerId: socket.playerId,
      playerName: player?.name,
      players: room.getPlayersArray(),
      newHostId: room.hostId
    });

    // If drawer left during drawing phase, end the round
    if (room.game.phase === 'drawing') {
      const drawer = room.game.getCurrentDrawer();
      if (!drawer || drawer.id === socket.playerId) {
        this.endRound(room);
      }
    }
  }
}

module.exports = MessageHandler;
