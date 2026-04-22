import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../App';
import { getSocket } from '../hooks/useSocket';
import { Player, ChatMessage } from '../types';
import DrawingCanvas from '../components/DrawingCanvas';
import ChatPanel from '../components/ChatPanel';
import WordSelection from '../components/WordSelection';
import RoundEnd from '../components/RoundEnd';
import GameOver from '../components/GameOver';
import Avatar from '../components/Avatar';

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    myId, myName,
    players, setPlayers,
    messages, addMessage,
    gameState, setGameState,
    currentWord, setCurrentWord,
    wordHint, setWordHint,
    timeLeft, setTimeLeft,
    isDrawing, setIsDrawing,
    room
  } = useAppContext();
  const socket = getSocket();

  // Local state
  const [phase, setPhase] = useState<string>('word_selection');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [wordLength, setWordLength] = useState<number[]>([]);
  const [roundEndData, setRoundEndData] = useState<{ word: string; scores: Array<{ id: string; name: string; score: number; avatar: number }> } | null>(null);
  const [gameOverData, setGameOverData] = useState<{ winner: { id: string; name: string; score: number; avatar: number } | null; leaderboard: Array<{ id: string; name: string; score: number; avatar: number }> } | null>(null);
  const [correctGuessNotif, setCorrectGuessNotif] = useState('');
  const msgIdCounter = useRef(0);

  const amIDrawing = drawerId === myId;
  const myPlayer = players.find(p => p.id === myId);

  const makeMsg = (partial: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => ({
    id: String(++msgIdCounter.current),
    timestamp: Date.now(),
    ...partial
  });

  useEffect(() => {
    if (!myName || !roomId) { navigate('/'); return; }
    if (!socket.connected) socket.connect();
  }, [myName, roomId, navigate, socket]);

  // Initialize from gameState if available
  useEffect(() => {
    if (gameState) {
      setPhase(gameState.phase);
      setDrawerId(gameState.drawerId);
      setCurrentRound(gameState.round || 1);
      setTotalRounds(gameState.totalRounds || 3);
      if (gameState.players) setPlayers(gameState.players);
      if (gameState.hint) setWordHint(gameState.hint);
      if (gameState.timeLeft) setTimeLeft(gameState.timeLeft);
    }
  }, []);

  useEffect(() => {
    // round_start: new round beginning, word selection phase
    const onRoundStart = (data: { drawerId: string; wordOptions: string[] | null; drawTime: number; round: number; totalRounds: number }) => {
      setDrawerId(data.drawerId);
      setCurrentRound(data.round);
      setTotalRounds(data.totalRounds);
      setPhase('word_selection');
      setRoundEndData(null);
      setCurrentWord(null);
      setWordHint('');
      setTimeLeft(data.drawTime);
      setWordLength([]);

      // If we are the drawer, show word options
      if (data.wordOptions && data.drawerId === myId) {
        setWordOptions(data.wordOptions);
        setIsDrawing(true);
      } else {
        setWordOptions([]);
        setIsDrawing(data.drawerId === myId);
      }

      addMessage(makeMsg({
        playerId: 'system', playerName: 'System',
        text: `Round ${data.round}/${data.totalRounds} — ${data.drawerId === myId ? 'Your turn to draw!' : `${players.find(p => p.id === data.drawerId)?.name || 'Someone'} is drawing!`}`,
        isSystem: true
      }));
    };

    // game_state: general state update
    const onGameState = (data: { phase: string; round: number; totalRounds: number; drawerId: string; wordLength?: number[]; hint?: string; timeLeft?: number; players?: Player[] }) => {
      setPhase(data.phase);
      setDrawerId(data.drawerId);
      setCurrentRound(data.round);
      setTotalRounds(data.totalRounds);
      if (data.players) setPlayers(data.players);
      if (data.hint !== undefined) setWordHint(data.hint);
      if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
      if (data.wordLength) setWordLength(data.wordLength);
      if (data.phase === 'drawing') setWordOptions([]);
    };

    const onTimerTick = ({ timeLeft: t }: { timeLeft: number }) => {
      setTimeLeft(t);
    };

    const onHintUpdate = ({ hint }: { hint: string }) => {
      setWordHint(hint);
    };

    const onGuessResult = (data: { correct: boolean; playerId: string; playerName: string; points: number }) => {
      if (data.correct) {
        const isMe = data.playerId === myId;
        addMessage(makeMsg({
          playerId: 'system', playerName: 'System',
          text: isMe
            ? `🎉 You guessed it! +${data.points} points`
            : `✅ ${data.playerName} guessed the word! +${data.points} pts`,
          isSystem: true,
          isCorrect: true
        }));
        if (isMe) {
          setCorrectGuessNotif('🎉 Correct!');
          setTimeout(() => setCorrectGuessNotif(''), 2500);
        }
      }
    };

    const onPlayersUpdate = ({ players: updatedPlayers }: { players: Player[] }) => {
      setPlayers(updatedPlayers);
    };

    const onRoundEnd = (data: { word: string; scores: Array<{ id: string; name: string; score: number; avatar: number }>; players: Player[] }) => {
      setPhase('round_end');
      setRoundEndData({ word: data.word, scores: data.scores });
      setPlayers(data.players);
      setCurrentWord(data.word);
    };

    const onGameOver = (data: { winner: { id: string; name: string; score: number; avatar: number } | null; leaderboard: Array<{ id: string; name: string; score: number; avatar: number }> }) => {
      setGameOverData(data);
    };

    const onChatMessage = (data: { playerId: string; playerName: string; text: string; isGuess: boolean; isClose: boolean }) => {
      addMessage(makeMsg({
        playerId: data.playerId,
        playerName: data.playerName,
        text: data.text,
        isGuess: data.isGuess,
        isClose: data.isClose
      }));
    };

    const onPlayerJoined = ({ players: p }: { player: Player; players: Player[] }) => setPlayers(p);
    const onPlayerLeft = ({ players: p, playerName }: { playerId: string; playerName: string; players: Player[]; newHostId: string }) => {
      setPlayers(p);
      addMessage(makeMsg({ playerId: 'system', playerName: 'System', text: `${playerName} left the game`, isSystem: true }));
    };

    socket.on('round_start', onRoundStart);
    socket.on('game_state', onGameState);
    socket.on('timer_tick', onTimerTick);
    socket.on('hint_update', onHintUpdate);
    socket.on('guess_result', onGuessResult);
    socket.on('players_update', onPlayersUpdate);
    socket.on('round_end', onRoundEnd);
    socket.on('game_over', onGameOver);
    socket.on('chat_message', onChatMessage);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);

    return () => {
      socket.off('round_start', onRoundStart);
      socket.off('game_state', onGameState);
      socket.off('timer_tick', onTimerTick);
      socket.off('hint_update', onHintUpdate);
      socket.off('guess_result', onGuessResult);
      socket.off('players_update', onPlayersUpdate);
      socket.off('round_end', onRoundEnd);
      socket.off('game_over', onGameOver);
      socket.off('chat_message', onChatMessage);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
    };
  }, [socket, myId, players, addMessage, setPlayers, setCurrentWord, setWordHint, setTimeLeft, setIsDrawing]);

  const handleWordChosen = useCallback((word: string) => {
    socket.emit('word_chosen', { word });
    setCurrentWord(word);
    setWordOptions([]);
    setPhase('drawing');
  }, [socket, setCurrentWord]);

  const handleSendMessage = useCallback((text: string) => {
    if (amIDrawing) {
      socket.emit('chat', { text });
    } else {
      socket.emit('guess', { text });
    }
  }, [socket, amIDrawing]);

  const drawerPlayer = players.find(p => p.id === drawerId);

  // Word display
  const displayWord = amIDrawing && currentWord
    ? currentWord
    : wordHint || (wordLength.length > 0 ? wordLength.map(l => '_'.repeat(l)).join('  ') : '');

  const timerPercent = totalRounds > 0 && room?.settings.drawTime
    ? (timeLeft / room.settings.drawTime) * 100
    : 50;
  const timerColor = timerPercent > 50 ? 'var(--accent3)' : timerPercent > 25 ? 'var(--accent2)' : 'var(--accent)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '10px', gap: 8, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Round indicator */}
        <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Round</span>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--accent3)' }}>{currentRound}/{totalRounds}</span>
        </div>

        {/* Word hint display */}
        <div className="card" style={{ flex: 1, padding: '8px 16px', textAlign: 'center', minWidth: 0 }}>
          {phase === 'drawing' || phase === 'word_selection' ? (
            <span style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              letterSpacing: amIDrawing && currentWord ? 2 : 8,
              fontWeight: 800,
              color: amIDrawing ? 'var(--accent2)' : 'var(--text)',
              textTransform: 'uppercase'
            }}>
              {amIDrawing && currentWord ? currentWord : (displayWord || '...')}
            </span>
          ) : (
            <span style={{ color: 'var(--text3)', fontWeight: 600 }}>
              {phase === 'round_end' ? '⏳ Next round soon...' : phase === 'lobby' ? '⏳ Waiting...' : '🎮 Game Over'}
            </span>
          )}
        </div>

        {/* Timer */}
        <div className="card" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, minWidth: 70 }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: timerColor, fontFamily: 'monospace', lineHeight: 1 }}>
            {timeLeft}
          </span>
          <div style={{ width: 50, height: 3, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${timerPercent}%`, height: '100%', background: timerColor, transition: 'width 1s linear, background 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Main game area */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr minmax(180px, 240px)', gap: 8, minHeight: 0 }}>
        {/* Left: Canvas + Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          {/* Drawer info */}
          {drawerPlayer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <Avatar index={drawerPlayer.avatar} name={drawerPlayer.name} size={28} isDrawing />
              <span style={{ fontWeight: 700, color: 'var(--text2)', fontSize: '0.9rem' }}>
                {amIDrawing ? '✏️ You are drawing!' : `${drawerPlayer.name} is drawing`}
              </span>
              {amIDrawing && (
                <span className="badge badge-yellow" style={{ marginLeft: 'auto' }}>🎨 Your turn</span>
              )}
            </div>
          )}

          {/* Canvas container */}
          <div style={{ position: 'relative', flex: 1 }}>
            <DrawingCanvas isDrawer={amIDrawing} />

            {/* Word selection overlay */}
            {phase === 'word_selection' && amIDrawing && wordOptions.length > 0 && (
              <WordSelection
                words={wordOptions}
                onChoose={handleWordChosen}
                drawTime={room?.settings.drawTime || 80}
              />
            )}

            {/* Waiting for drawer overlay */}
            {phase === 'word_selection' && !amIDrawing && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(10,15,30,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10, borderRadius: 12, backdropFilter: 'blur(2px)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8, animation: 'pulse 1s infinite' }}>✏️</div>
                  <p style={{ fontWeight: 700, color: 'var(--text2)' }}>
                    {drawerPlayer?.name || 'Drawer'} is choosing a word...
                  </p>
                </div>
              </div>
            )}

            {/* Round end overlay */}
            {phase === 'round_end' && roundEndData && (
              <RoundEnd
                word={roundEndData.word}
                scores={roundEndData.scores}
                players={players}
              />
            )}
          </div>

          {/* Players row */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {players.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: 'var(--card)', borderRadius: 10, padding: '8px 10px',
                  border: `1px solid ${p.isDrawing ? 'var(--accent2)' : p.hasGuessedCorrectly ? 'var(--green)' : p.id === myId ? 'var(--accent3)' : 'var(--border)'}`,
                  flexShrink: 0, minWidth: 70
                }}
              >
                <Avatar index={p.avatar} name={p.name} size={28} isDrawing={p.isDrawing} hasGuessed={p.hasGuessedCorrectly} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: p.id === myId ? 'var(--accent3)' : 'var(--text2)', maxWidth: 65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent2)' }}>{p.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 300 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            💬 {amIDrawing ? 'Chat' : 'Guess / Chat'}
          </div>
          <ChatPanel
            messages={messages}
            onSend={handleSendMessage}
            isDrawer={amIDrawing}
            hasGuessedCorrectly={myPlayer?.hasGuessedCorrectly || false}
            phase={phase}
          />
        </div>
      </div>

      {/* Correct guess notification */}
      {correctGuessNotif && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'linear-gradient(135deg, var(--green), #27ae60)',
          color: 'white', padding: '20px 36px', borderRadius: 16,
          fontSize: '2rem', fontWeight: 900, zIndex: 200,
          boxShadow: '0 20px 60px rgba(46,204,113,0.5)',
          animation: 'pop 0.4s ease'
        }}>
          {correctGuessNotif}
        </div>
      )}

      {/* Game over */}
      {gameOverData && (
        <GameOver winner={gameOverData.winner} leaderboard={gameOverData.leaderboard} myId={myId} />
      )}
    </div>
  );
}
