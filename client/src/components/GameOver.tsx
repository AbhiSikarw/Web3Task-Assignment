import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';

interface GameOverProps {
  winner: { id: string; name: string; score: number; avatar: number } | null;
  leaderboard: Array<{ id: string; name: string; score: number; avatar: number }>;
  myId: string;
}

export default function GameOver({ winner, leaderboard, myId }: GameOverProps) {
  const navigate = useNavigate();
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple confetti
    const container = confettiRef.current;
    if (!container) return;
    const colors = ['#e94560', '#4ecdc4', '#f5a623', '#45b7d1', '#a855f7'];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('div');
      el.style.cssText = `
        position:absolute; width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        left:${Math.random() * 100}%;
        top:-20px;
        animation: confetti-fall ${2 + Math.random() * 3}s ease ${Math.random() * 2}s forwards;
      `;
      container.appendChild(el);
    }
    return () => { if (container) container.innerHTML = ''; };
  }, []);

  const isWinner = winner?.id === myId;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,15,30,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      flexDirection: 'column',
      padding: 20
    }}>
      {/* Confetti container */}
      <div ref={confettiRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 101 }} />

      <div style={{ textAlign: 'center', maxWidth: 460, width: '100%', position: 'relative', zIndex: 102 }}>
        <div style={{ fontSize: '4rem', marginBottom: 8, animation: 'pop 0.6s ease' }}>
          {isWinner ? '🏆' : '🎮'}
        </div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--accent2)', marginBottom: 4, animation: 'pop 0.5s ease' }}>
          {isWinner ? 'You Won!' : 'Game Over!'}
        </h1>

        {winner && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(233,69,96,0.1))',
            border: '2px solid rgba(245,166,35,0.3)',
            borderRadius: 16, padding: '20px 28px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 16,
            justifyContent: 'center', animation: 'fadeIn 0.5s ease 0.2s both'
          }}>
            <Avatar index={winner.avatar} name={winner.name} size={56} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Winner</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent2)' }}>{winner.name}</p>
              <p style={{ color: 'var(--text2)', fontWeight: 700 }}>{winner.score} points</p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Final Scores</p>
          {leaderboard.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px', borderRadius: 10,
                background: p.id === myId ? 'rgba(78,205,196,0.08)' : i === 0 ? 'rgba(245,166,35,0.06)' : 'transparent',
                border: p.id === myId ? '1px solid rgba(78,205,196,0.2)' : '1px solid transparent',
                marginBottom: 4,
                animation: `fadeIn 0.3s ease ${i * 0.07}s both`
              }}
            >
              <span style={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: i === 0 ? '1.3rem' : '0.9rem', color: ['var(--accent2)', '#c0c0c0', '#cd7f32', 'var(--text3)'][Math.min(i, 3)] }}>
                {['🥇', '🥈', '🥉'][i] || `#${i + 1}`}
              </span>
              <Avatar index={p.avatar} name={p.name} size={32} />
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontWeight: 800, color: 'var(--accent3)', fontSize: '1.1rem' }}>{p.score}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/')}>
            🏠 Home
          </button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={() => navigate('/')}>
            🎮 Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
