import React from 'react';

const AVATAR_COLORS = [
  ['#e94560', '#ff6b6b'],
  ['#4ecdc4', '#44a08d'],
  ['#f5a623', '#f7971e'],
  ['#45b7d1', '#2980b9'],
  ['#a855f7', '#7c3aed'],
  ['#ec4899', '#be185d'],
  ['#22c55e', '#16a34a'],
  ['#f97316', '#ea580c'],
  ['#06b6d4', '#0891b2'],
  ['#eab308', '#ca8a04'],
];

const AVATAR_EMOJIS = ['🎨', '🦊', '🐼', '🦋', '🐙', '🦁', '🐬', '🦄', '🐸', '🦉'];

interface AvatarProps {
  index: number;
  name: string;
  size?: number;
  showName?: boolean;
  isDrawing?: boolean;
  hasGuessed?: boolean;
}

export default function Avatar({ index, name, size = 40, showName = false, isDrawing = false, hasGuessed = false }: AvatarProps) {
  const [bg1, bg2] = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const emoji = AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        boxShadow: isDrawing
          ? `0 0 0 3px ${bg1}, 0 0 12px ${bg1}60`
          : hasGuessed
          ? '0 0 0 2px #2ecc71'
          : 'none',
        transition: 'box-shadow 0.3s ease',
        position: 'relative',
        flexShrink: 0
      }}>
        {emoji}
        {hasGuessed && (
          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#2ecc71',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            border: '2px solid #1a1a2e'
          }}>✓</div>
        )}
        {isDrawing && (
          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: bg1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            border: '2px solid #1a1a2e'
          }}>✏️</div>
        )}
      </div>
      {showName && (
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#a8b2d8',
          maxWidth: size + 20,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          {name}
        </span>
      )}
    </div>
  );
}
