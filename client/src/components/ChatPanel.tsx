import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isDrawer: boolean;
  hasGuessedCorrectly: boolean;
  phase: string;
}

export default function ChatPanel({ messages, onSend, isDrawer, hasGuessedCorrectly, phase }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  const canGuess = !isDrawer && phase === 'drawing' && !hasGuessedCorrectly;

  const placeholder = isDrawer
    ? '💬 Chat with players...'
    : hasGuessedCorrectly
    ? '✅ You guessed it!'
    : phase === 'drawing'
    ? '🤔 Type your guess...'
    : '💬 Chat...';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 4,
        minHeight: 0
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem', padding: '20px 0' }}>
            Game chat will appear here 💬
          </div>
        )}
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 6
      }}>
        <input
          className="input-field"
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '0.9rem',
            background: canGuess ? 'rgba(78,205,196,0.07)' : 'var(--bg2)',
            borderColor: canGuess ? 'var(--accent3)' : undefined,
            opacity: hasGuessedCorrectly ? 0.6 : 1
          }}
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={hasGuessedCorrectly && !isDrawer}
          maxLength={100}
        />
        <button
          onClick={handleSend}
          disabled={(hasGuessedCorrectly && !isDrawer) || !input.trim()}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'var(--accent)',
            color: 'white',
            fontWeight: 800,
            fontSize: '1rem',
            border: 'none',
            opacity: (!input.trim() || (hasGuessedCorrectly && !isDrawer)) ? 0.5 : 1
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.isSystem) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4px 10px',
        background: message.isCorrect ? 'rgba(46,204,113,0.12)' : 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        fontSize: '0.78rem',
        color: message.isCorrect ? '#2ecc71' : 'var(--text3)',
        fontWeight: 600,
        border: message.isCorrect ? '1px solid rgba(46,204,113,0.2)' : 'none',
        animation: message.isCorrect ? 'pop 0.4s ease' : 'none'
      }}>
        {message.text}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
      <div style={{
        flexShrink: 0,
        width: 8, height: 8, borderRadius: '50%',
        background: getPlayerColor(message.playerId),
        marginTop: 7
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: getPlayerColor(message.playerId) }}>
          {message.playerName}
        </span>
        <span style={{
          display: 'block',
          fontSize: '0.85rem',
          color: message.isClose ? 'var(--accent2)' : 'var(--text)',
          wordBreak: 'break-word',
          fontWeight: message.isClose ? 700 : 400
        }}>
          {message.text}
          {message.isClose && <span style={{ fontSize: '0.7rem', marginLeft: 4 }}>🔥 close!</span>}
        </span>
      </div>
    </div>
  );
}

const playerColors = ['#e94560', '#4ecdc4', '#f5a623', '#45b7d1', '#a855f7', '#ec4899', '#2ecc71', '#f97316'];

function getPlayerColor(playerId: string): string {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  return playerColors[Math.abs(hash) % playerColors.length];
}
