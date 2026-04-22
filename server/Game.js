const { getRandomWords } = require('./words');

class Game {
  constructor(settings) {
    this.settings = settings; // { maxPlayers, rounds, drawTime, wordCount, hints }
    this.currentRound = 0;
    this.currentDrawerIndex = 0;
    this.currentWord = null;
    this.wordOptions = [];
    this.phase = 'lobby'; // lobby | word_selection | drawing | round_end | game_over
    this.timer = null;
    this.timeLeft = 0;
    this.hintsRevealed = 0;
    this.hintPositions = [];
    this.canvasStrokes = []; // Store all strokes for replay/rejoin
    this.drawerOrder = []; // Shuffled player order
    this.roundScores = {}; // scores per round
  }

  // Build shuffled drawer order from player list
  initDrawerOrder(players) {
    this.drawerOrder = [...players].sort(() => Math.random() - 0.5);
    this.currentDrawerIndex = 0;
    this.currentRound = 1;
  }

  getCurrentDrawer() {
    return this.drawerOrder[this.currentDrawerIndex] || null;
  }

  startWordSelection() {
    this.phase = 'word_selection';
    this.wordOptions = getRandomWords(this.settings.wordCount);
    this.currentWord = null;
    this.canvasStrokes = [];
    this.hintsRevealed = 0;
  }

  chooseWord(word) {
    if (!this.wordOptions.includes(word)) return false;
    this.currentWord = word;
    this.phase = 'drawing';
    this.timeLeft = this.settings.drawTime;
    // Generate hint positions (random letter positions to reveal)
    this.hintPositions = this.generateHintPositions(word);
    return true;
  }

  generateHintPositions(word) {
    const positions = word.split('').map((_, i) => i).filter(i => word[i] !== ' ');
    // Shuffle positions for random reveal order
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions;
  }

  getHintString(revealCount = 0) {
    if (!this.currentWord) return '';
    const revealed = new Set(this.hintPositions.slice(0, revealCount));
    return this.currentWord.split('').map((char, i) => {
      if (char === ' ') return ' ';
      return revealed.has(i) ? char : '_';
    }).join(' ');
  }

  revealNextHint() {
    if (this.hintsRevealed < this.hintPositions.length) {
      this.hintsRevealed++;
    }
    return this.getHintString(this.hintsRevealed);
  }

  checkGuess(guess) {
    if (!this.currentWord) return false;
    return guess.trim().toLowerCase() === this.currentWord.toLowerCase();
  }

  calculatePoints(timeLeft, totalTime, guessOrder) {
    // First guesser gets most points, later guessers get less
    const timeBonus = Math.floor((timeLeft / totalTime) * 200);
    const orderPenalty = guessOrder * 20;
    return Math.max(50, 300 + timeBonus - orderPenalty);
  }

  calculateDrawerPoints(correctGuessers) {
    return correctGuessers * 50; // Drawer gets points per correct guesser
  }

  addStroke(strokeData) {
    this.canvasStrokes.push(strokeData);
  }

  clearCanvas() {
    this.canvasStrokes = [];
  }

  undoLastStroke() {
    // Remove strokes belonging to the last draw_start -> draw_end sequence
    let i = this.canvasStrokes.length - 1;
    while (i >= 0 && this.canvasStrokes[i].type !== 'start') i--;
    this.canvasStrokes = this.canvasStrokes.slice(0, i);
  }

  advanceToNextDrawer(players) {
    this.currentDrawerIndex++;
    if (this.currentDrawerIndex >= this.drawerOrder.length) {
      // All players drew this round
      this.currentRound++;
      if (this.currentRound > this.settings.rounds) {
        this.phase = 'game_over';
        return false; // Game over
      }
      // Re-shuffle for next round
      this.drawerOrder = [...players].sort(() => Math.random() - 0.5);
      this.currentDrawerIndex = 0;
    }
    return true; // Continue game
  }

  endRound() {
    this.phase = 'round_end';
    clearInterval(this.timer);
    this.timer = null;
  }

  toJSON() {
    return {
      currentRound: this.currentRound,
      totalRounds: this.settings.rounds,
      phase: this.phase,
      timeLeft: this.timeLeft,
      hintsRevealed: this.hintsRevealed,
      currentDrawerId: this.getCurrentDrawer()?.id || null
    };
  }
}

module.exports = Game;
