import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { getSocket } from '../hooks/useSocket';
import { PublicRoom } from '../types';

export default function HomePage() {
  const navigate = useNavigate();
  const { myName, setMyName, setRoom, setPlayers } = useAppContext();
  const socket = getSocket();

  const [tab, setTab] = useState<'home' | 'create' | 'join' | 'public'>('home');
  const [nameInput, setNameInput] = useState(myName);
  const [joinCode, setJoinCode] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create room settings
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 2,
    isPrivate: false
  });

  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, [socket]);

  const fetchPublicRooms = async () => {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    setPublicRooms(data.rooms || []);
  };

  useEffect(() => {
    if (tab === 'public') fetchPublicRooms();
  }, [tab]);

  const validateName = () => {
    const name = nameInput.trim();
    if (!name || name.length < 2) { setError('Name must be at least 2 characters'); return null; }
    if (name.length > 20) { setError('Name must be under 20 characters'); return null; }
    return name;
  };

  const handleCreate = () => {
    const name = validateName();
    if (!name) return;
    setMyName(name);
    setLoading(true);
    setError('');

    socket.emit('create_room', { hostName: name, settings }, (res: { success: boolean; roomId?: string; error?: string; room?: unknown; player?: unknown; playerId?: string }) => {
      setLoading(false);
      if (!res.success) { setError(res.error || 'Failed to create room'); return; }
      setRoom(res.room as Parameters<typeof setRoom>[0]);
      setPlayers([res.player as Parameters<typeof setPlayers>[0][0]]);
      navigate(`/lobby/${res.roomId}`);
    });
  };

  const handleJoin = (roomId?: string) => {
    const name = validateName();
    if (!name) return;
    const code = (roomId || joinCode).trim().toUpperCase();
    if (!code) { setError('Enter a room code'); return; }
    setMyName(name);
    setLoading(true);
    setError('');

    socket.emit('join_room', { roomId: code, playerName: name }, (res: { success: boolean; error?: string; room?: unknown; players?: unknown[]; playerId?: string }) => {
      setLoading(false);
      if (!res.success) { setError(res.error || 'Failed to join room'); return; }
      setRoom(res.room as Parameters<typeof setRoom>[0]);
      setPlayers((res.room as { players: Parameters<typeof setPlayers>[0] })?.players || []);
      navigate(`/lobby/${code}`);
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: 'var(--accent)', textShadow: '0 0 40px rgba(233,69,96,0.4)', letterSpacing: 2, lineHeight: 1 }}>
          🎨 skribbl
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '1.1rem', marginTop: 8, fontWeight: 600 }}>
          Draw. Guess. Have fun!
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 460, padding: 32 }}>
        {/* Name input - always shown */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: 'var(--text2)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Your Name
          </label>
          <input
            className="input-field"
            placeholder="Enter your name..."
            value={nameInput}
            onChange={e => { setNameInput(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter' && tab === 'join') handleJoin(); }}
            maxLength={20}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { key: 'create', label: '+ Create' },
            { key: 'join', label: '🔑 Join' },
            { key: 'public', label: '🌍 Public' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key as typeof tab); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                background: tab === t.key ? 'var(--accent)' : 'var(--card2)',
                color: tab === t.key ? 'white' : 'var(--text2)',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '1px solid',
                borderColor: tab === t.key ? 'var(--accent)' : 'var(--border)',
                transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Create Room */}
        {tab === 'create' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <SettingSlider label="Players" min={2} max={20} value={settings.maxPlayers} onChange={v => setSettings(s => ({ ...s, maxPlayers: v }))} />
              <SettingSlider label="Rounds" min={2} max={10} value={settings.rounds} onChange={v => setSettings(s => ({ ...s, rounds: v }))} />
              <SettingSlider label="Draw Time" min={15} max={240} value={settings.drawTime} unit="s" onChange={v => setSettings(s => ({ ...s, drawTime: v }))} />
              <SettingSlider label="Word Count" min={1} max={5} value={settings.wordCount} onChange={v => setSettings(s => ({ ...s, wordCount: v }))} />
              <SettingSlider label="Hints" min={0} max={5} value={settings.hints} onChange={v => setSettings(s => ({ ...s, hints: v }))} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase' }}>Private</label>
                <button
                  onClick={() => setSettings(s => ({ ...s, isPrivate: !s.isPrivate }))}
                  style={{
                    padding: '8px',
                    borderRadius: 8,
                    background: settings.isPrivate ? 'rgba(78,205,196,0.2)' : 'var(--bg2)',
                    border: `1px solid ${settings.isPrivate ? 'var(--accent3)' : 'var(--border)'}`,
                    color: settings.isPrivate ? 'var(--accent3)' : 'var(--text2)',
                    fontWeight: 700
                  }}
                >
                  {settings.isPrivate ? '🔒 Private' : '🌍 Public'}
                </button>
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={loading}>
              {loading ? '⏳ Creating...' : '🎮 Create Room'}
            </button>
          </div>
        )}

        {/* Join Room */}
        {tab === 'join' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <input
              className="input-field"
              placeholder="Enter room code..."
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              maxLength={8}
              style={{ marginBottom: 16, fontSize: '1.2rem', letterSpacing: 4, textAlign: 'center', fontFamily: 'monospace' }}
            />
            <button className="btn-accent" style={{ width: '100%' }} onClick={() => handleJoin()} disabled={loading}>
              {loading ? '⏳ Joining...' : '🚀 Join Room'}
            </button>
          </div>
        )}

        {/* Public Rooms */}
        {tab === 'public' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text2)', fontWeight: 700 }}>
                {publicRooms.length} open room{publicRooms.length !== 1 ? 's' : ''}
              </span>
              <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={fetchPublicRooms}>
                🔄 Refresh
              </button>
            </div>
            {publicRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)', background: 'var(--bg2)', borderRadius: 12 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎭</div>
                <p>No open rooms yet.</p>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Create one!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {publicRooms.map(r => (
                  <div
                    key={r.id}
                    style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => handleJoin(r.id)}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: 2 }}>{r.id}</span>
                      <span style={{ marginLeft: 10, fontSize: '0.8rem', color: 'var(--text2)' }}>
                        👥 {r.playerCount}/{r.maxPlayers} · 🔄 {r.rounds} rounds
                      </span>
                    </div>
                    <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Join</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{ marginTop: 20, color: 'var(--text3)', fontSize: '0.8rem' }}>
        2–20 players · Real-time drawing · No login required
      </p>
    </div>
  );
}

function SettingSlider({ label, min, max, value, unit = '', onChange }: {
  label: string; min: number; max: number; value: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--accent3)' }}>{value}{unit}</span>
      </label>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent3)' }}
      />
    </div>
  );
}
