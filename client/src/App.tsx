import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import { Player, Room, GameState, ChatMessage } from './types';
import { getSocket } from './hooks/useSocket';

interface AppContextType {
  myId: string;
  myName: string;
  myAvatar: number;
  setMyName: (n: string) => void;
  room: Room | null;
  setRoom: (r: Room | null) => void;
  gameState: GameState | null;
  setGameState: (g: GameState | null) => void;
  players: Player[];
  setPlayers: (p: Player[]) => void;
  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  currentWord: string | null;
  setCurrentWord: (w: string | null) => void;
  wordHint: string;
  setWordHint: (h: string) => void;
  timeLeft: number;
  setTimeLeft: (t: number) => void;
  isDrawing: boolean;
  setIsDrawing: (d: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}

export default function App() {
  const socket = getSocket();
  const [myName, setMyName] = useState(() => localStorage.getItem('skribbl_name') || '');
  const [myAvatar] = useState(() => parseInt(localStorage.getItem('skribbl_avatar') || String(Math.floor(Math.random() * 10))));
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [wordHint, setWordHint] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages(prev => [...prev.slice(-200), m]);
  }, []);

  const handleSetMyName = useCallback((n: string) => {
    setMyName(n);
    localStorage.setItem('skribbl_name', n);
  }, []);

  // Global socket event listeners
  useEffect(() => {
    const handleConnect = () => {
      console.log('Connected to server, id:', socket.id);
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket]);

  const myId = socket.id || '';

  return (
    <AppContext.Provider value={{
      myId,
      myName,
      myAvatar,
      setMyName: handleSetMyName,
      room, setRoom,
      gameState, setGameState,
      players, setPlayers,
      messages, addMessage,
      currentWord, setCurrentWord,
      wordHint, setWordHint,
      timeLeft, setTimeLeft,
      isDrawing, setIsDrawing
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lobby/:roomId" element={<LobbyPage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
