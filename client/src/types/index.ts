export interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
  hasGuessedCorrectly: boolean;
  isDrawing: boolean;
  avatar: number;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  isPrivate: boolean;
}

export interface GameState {
  phase: 'lobby' | 'word_selection' | 'drawing' | 'round_end' | 'game_over';
  round: number;
  totalRounds: number;
  drawerId: string | null;
  wordLength?: number[];
  hint?: string;
  timeLeft?: number;
  players?: Player[];
}

export interface Room {
  id: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  playerCount: number;
  game: GameState;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  isGuess?: boolean;
  isClose?: boolean;
  isSystem?: boolean;
  isCorrect?: boolean;
  timestamp: number;
}

export interface StrokeData {
  type: 'start' | 'move' | 'end';
  x: number;
  y: number;
  color?: string;
  size?: number;
}

export interface PublicRoom {
  id: string;
  playerCount: number;
  maxPlayers: number;
  rounds: number;
  phase: string;
}
