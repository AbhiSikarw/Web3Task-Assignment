import React, { useState, useEffect } from 'react';

interface WordSelectionProps {
  words: string[];
  onChoose: (word: string) => void;
  drawTime: number;
}

export default function WordSelection({ words, onChoose, drawTime }: WordSelectionProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Auto-pick first word
      onChoose(words[0]);
      return;
    }
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, words, onChoose]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(10,15,30,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 20, borderRadius: 12,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{ textAlign: 'center', padding: 32, maxWidth: 440 }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>✏️</div>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--accent3)', marginBottom: 6 }}>
          Choose a Word
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: 24 }}>
          Auto-picks in <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{timeLeft}s</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {words.map((word, i) => (
            <button
              key={word}
              onClick={() => onChoose(word)}
              onMouseEnter={() => setHovered(word)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '16px 28px',
                borderRadius: 12,
                background: hovered === word
                  ? 'linear-gradient(135deg, var(--accent3), #3aafa9)'
                  : 'var(--card2)',
                color: hovered === word ? '#0f3460' : 'var(--text)',
                fontWeight: 800,
                fontSize: '1.2rem',
                border: `2px solid ${hovered === word ? 'var(--accent3)' : 'var(--border)'}`,
                transition: 'all 0.2s',
                transform: hovered === word ? 'scale(1.03)' : 'scale(1)',
                letterSpacing: '0.05em',
                textTransform: 'capitalize',
                animation: `pop 0.3s ease ${i * 0.08}s both`
              }}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
