const { nanoid } = require('nanoid');
const Player = require('./Player');
const Game = require('./Game');

class Room {
  constructor(hostId, hostName, hostSocketId, settings = {}) {
    this.id = nanoid(8).toUpperCase();
    this.hostId = hostId;
    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 2,
      isPrivate: settings.isPrivate || false,
      ...settings
    };
    this.players = new Map(); // id -> Player
    this.game = new Game(this.settings);
    this.createdAt = Date.now();
    this.correctGuessersThisRound = 0;

    // Add host as first player
    this.addPlayer(hostId, hostName, hostSocketId);
  }

  addPlayer(id, name, socketId) {
    if (this.players.size >= this.settings.maxPlayers) return null;
    const player = new Player(id, name, socketId);
    this.players.set(id, player);
    return player;
  }

  removePlayer(id) {
    this.players.delete(id);
    // If host leaves, assign new host
    if (id === this.hostId && this.players.size > 0) {
      this.hostId = this.players.keys().next().value;
    }
  }

  getPlayerBySocketId(socketId) {
    for (const player of this.players.values()) {
      if (player.socketId === socketId) return player;
    }
    return null;
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  getPlayersArray() {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  isFull() {
    return this.players.size >= this.settings.maxPlayers;
  }

  isEmpty() {
    return this.players.size === 0;
  }

  canStart() {
    return this.players.size >= 2;
  }

  startGame() {
    const playerList = Array.from(this.players.values());
    this.game.initDrawerOrder(playerList);
    this.correctGuessersThisRound = 0;
    playerList.forEach(p => {
      p.score = 0;
      p.resetRoundState();
    });
  }

  startNewRound() {
    this.correctGuessersThisRound = 0;
    // Reset all players' round state
    for (const player of this.players.values()) {
      player.resetRoundState();
    }
    // Set current drawer
    const drawer = this.game.getCurrentDrawer();
    if (drawer) {
      const drawerPlayer = this.players.get(drawer.id);
      if (drawerPlayer) drawerPlayer.setDrawing(true);
    }
    this.game.startWordSelection();
  }

  getLeaderboard() {
    return Array.from(this.players.values())
      .map(p => ({ id: p.id, name: p.name, score: p.score, avatar: p.avatar }))
      .sort((a, b) => b.score - a.score);
  }

  getWinner() {
    const leaderboard = this.getLeaderboard();
    return leaderboard[0] || null;
  }

  toJSON() {
    return {
      id: this.id,
      hostId: this.hostId,
      settings: this.settings,
      players: this.getPlayersArray(),
      playerCount: this.players.size,
      game: this.game.toJSON()
    };
  }

  toPublicJSON() {
    return {
      id: this.id,
      playerCount: this.players.size,
      maxPlayers: this.settings.maxPlayers,
      rounds: this.settings.rounds,
      phase: this.game.phase
    };
  }
}

module.exports = Room;
