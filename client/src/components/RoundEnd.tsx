import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import Avatar from './Avatar';

interface RoundEndProps {
  word: string;
  scores: Array<{ id: string; name: string; score: number; avatar: number }>;
  players: Player[];
  onContinue?: () => void;
}

export default function RoundEnd({ word, scores, players }: RoundEndProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(10,15,30,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 20, borderRadius: 12,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ textAlign: 'center', padding: 32, maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎨</div>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: 6 }}>The word was</p>
        <h2 style={{
          fontSize: '2.5rem',
          color: 'var(--accent3)',
          textTransform: 'uppercase',
          letterSpacing: 3,
          marginBottom: 24,
          textShadow: '0 0 30px rgba(78,205,196,0.5)',
          animation: 'pop 0.5s ease'
        }}>
          {word}
        </h2>

        {/* Scores */}
        <div style={{ background: 'var(--card)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
            Leaderboard
          </p>
          {scores.slice(0, 5).map((s, i) => {
            const player = players.find(p => p.id === s.id);
            return (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 8px', borderRadius: 8,
                background: i === 0 ? 'rgba(245,166,35,0.1)' : 'transparent',
                marginBottom: 4,
                animation: `fadeIn 0.3s ease ${i * 0.06}s both`
              }}>
                <span style={{ width: 22, textAlign: 'center', fontWeight: 800, color: i === 0 ? 'var(--accent2)' : 'var(--text3)', fontSize: i === 0 ? '1.1rem' : '0.85rem' }}>
                  {i === 0 ? '👑' : `#${i + 1}`}
                </span>
                <Avatar index={s.avatar} name={s.name} size={30} />
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</span>
                <span style={{ fontWeight: 800, color: player?.hasGuessedCorrectly ? 'var(--green)' : 'var(--text2)', fontSize: '1rem' }}>
                  {s.score} pts
                </span>
              </div>
            );
          })}
        </div>

        <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
          Next round in <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{countdown}s</span>...
        </p>
      </div>
    </div>
  );
}
