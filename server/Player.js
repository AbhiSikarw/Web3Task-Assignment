class Player {
  constructor(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isReady = false;
    this.hasGuessedCorrectly = false;
    this.isDrawing = false;
    this.avatar = Math.floor(Math.random() * 10); // Random avatar index 0-9
  }

  addScore(points) {
    this.score += points;
  }

  resetRoundState() {
    this.hasGuessedCorrectly = false;
    this.isDrawing = false;
  }

  setDrawing(drawing) {
    this.isDrawing = drawing;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isReady: this.isReady,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      isDrawing: this.isDrawing,
      avatar: this.avatar
    };
  }
}

module.exports = Player;
