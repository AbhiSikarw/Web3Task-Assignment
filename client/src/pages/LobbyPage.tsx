// import React, { useEffect, useState } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useAppContext } from '../App';
// import { getSocket } from '../hooks/useSocket';
// import { Player } from '../types';
// import Avatar from '../components/Avatar';

// export default function LobbyPage() {
//   const { roomId } = useParams<{ roomId: string }>();
//   const navigate = useNavigate();
//   const { myId, myName, room, setRoom, players, setPlayers, setGameState } = useAppContext();
//   const socket = getSocket();
//   const [copied, setCopied] = useState(false);
//   const [error, setError] = useState('');

//   const isHost = room?.hostId === myId;

//   useEffect(() => {
//     if (!myName || !roomId) { navigate('/'); return; }
//     if (!socket.connected) socket.connect();

//     // If we have room data already (just created/joined), use it
//     // Otherwise try to fetch room info
//     if (!room) {
//       fetch(`/api/rooms/${roomId}`)
//         .then(r => r.json())
//         .then(data => {
//           if (data.room) {
//             setRoom(data.room);
//             setPlayers(data.room.players);
//           } else {
//             navigate('/');
//           }
//         })
//         .catch(() => navigate('/'));
//     }

//     const onPlayerJoined = ({ players: updatedPlayers }: { player: Player; players: Player[] }) => {
//       setPlayers(updatedPlayers);
//     };

//     const onPlayerLeft = ({ players: updatedPlayers, newHostId }: { playerId: string; playerName: string; players: Player[]; newHostId: string }) => {
//       setPlayers(updatedPlayers);
//       if (room) setRoom({ ...room, hostId: newHostId, players: updatedPlayers });
//     };

//     const onGameState = (state: { phase: string; round: number; totalRounds: number; drawerId: string; players: Player[] }) => {
//       if (state.phase !== 'lobby') {
//         setGameState(state as Parameters<typeof setGameState>[0]);
//         setPlayers(state.players || []);
//         navigate(`/game/${roomId}`);
//       }
//     };

//     socket.on('player_joined', onPlayerJoined);
//     socket.on('player_left', onPlayerLeft);
//     socket.on('game_state', onGameState);
//     socket.on('round_start', () => navigate(`/game/${roomId}`));

//     return () => {
//       socket.off('player_joined', onPlayerJoined);
//       socket.off('player_left', onPlayerLeft);
//       socket.off('game_state', onGameState);
//       socket.off('round_start');
//     };
//   }, [socket, roomId, myName, navigate, room, setRoom, setPlayers, setGameState]);

//   const handleStart = () => {
//     if (players.length < 2) { setError('Need at least 2 players to start!'); return; }
//     socket.emit('start_game', {}, (res: { success: boolean; error?: string }) => {
//       if (!res?.success) setError(res?.error || 'Failed to start');
//     });
//   };

//   const copyLink = () => {
//     const url = `${window.location.origin}?join=${roomId}`;
//     navigator.clipboard.writeText(url).then(() => {
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     });
//   };

//   const copyCode = () => {
//     navigator.clipboard.writeText(roomId || '');
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const currentPlayers = room?.players || players;

//   return (
//     <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
//       <div style={{ width: '100%', maxWidth: 560 }}>
//         {/* Header */}
//         <div style={{ textAlign: 'center', marginBottom: 28 }}>
//           <h1 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: 4 }}>🎨 Game Lobby</h1>
//           <p style={{ color: 'var(--text2)', fontWeight: 600 }}>Waiting for players...</p>
//         </div>

//         {/* Room Code */}
//         <div className="card" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
//           <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Room Code</p>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
//             <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: 6, color: 'var(--accent3)', textShadow: '0 0 20px rgba(78,205,196,0.4)' }}>
//               {roomId}
//             </span>
//           </div>
//           <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
//             <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={copyCode}>
//               {copied ? '✅ Copied!' : '📋 Copy Code'}
//             </button>
//             <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={copyLink}>
//               🔗 Copy Link
//             </button>
//           </div>
//         </div>

//         {/* Settings summary */}
//         {room && (
//           <div className="card" style={{ padding: 16, marginBottom: 16 }}>
//             <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Room Settings</p>
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
//               {[
//                 { icon: '👥', label: `${currentPlayers.length}/${room.settings.maxPlayers} players` },
//                 { icon: '🔄', label: `${room.settings.rounds} rounds` },
//                 { icon: '⏱️', label: `${room.settings.drawTime}s draw time` },
//                 { icon: '📝', label: `${room.settings.wordCount} words` },
//                 { icon: '💡', label: `${room.settings.hints} hints` },
//                 { icon: room.settings.isPrivate ? '🔒' : '🌍', label: room.settings.isPrivate ? 'Private' : 'Public' },
//               ].map(s => (
//                 <span key={s.label} className="badge badge-blue">{s.icon} {s.label}</span>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Players */}
//         <div className="card" style={{ padding: 20, marginBottom: 16 }}>
//           <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
//             Players ({currentPlayers.length})
//           </p>
//           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
//             {currentPlayers.map(p => (
//               <div
//                 key={p.id}
//                 style={{
//                   display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
//                   background: 'var(--bg2)', borderRadius: 12, padding: '14px 8px',
//                   border: `1px solid ${p.id === myId ? 'var(--accent3)' : 'var(--border)'}`,
//                   position: 'relative', animation: 'pop 0.4s ease'
//                 }}
//               >
//                 <Avatar index={p.avatar} name={p.name} size={44} />
//                 <span style={{ fontSize: '0.85rem', fontWeight: 700, color: p.id === myId ? 'var(--accent3)' : 'var(--text)', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
//                   {p.name}
//                 </span>
//                 {p.id === (room?.hostId) && (
//                   <span className="badge badge-yellow" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>👑 Host</span>
//                 )}
//                 {p.id === myId && p.id !== room?.hostId && (
//                   <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>You</span>
//                 )}
//               </div>
//             ))}
//             {/* Empty slots */}
//             {room && Array.from({ length: Math.max(0, room.settings.maxPlayers - currentPlayers.length) }).slice(0, 4).map((_, i) => (
//               <div
//                 key={`empty-${i}`}
//                 style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg2)', borderRadius: 12, padding: '14px 8px', border: '1px dashed var(--border)', opacity: 0.4, minHeight: 100 }}
//               >
//                 <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>?</div>
//                 <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Waiting...</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {error && (
//           <div style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: 'var(--accent)', fontWeight: 600 }}>
//             ⚠️ {error}
//           </div>
//         )}

//         {/* Actions */}
//         <div style={{ display: 'flex', gap: 10 }}>
//           <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/')}>
//             ← Leave
//           </button>
//           {isHost ? (
//             <button
//               className="btn-primary"
//               style={{ flex: 2 }}
//               onClick={handleStart}
//               disabled={currentPlayers.length < 2}
//             >
//               {currentPlayers.length < 2 ? '⏳ Need 2+ players' : '🎮 Start Game!'}
//             </button>
//           ) : (
//             <div style={{ flex: 2, background: 'var(--card2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontWeight: 700, fontSize: '0.9rem' }}>
//               ⏳ Waiting for host...
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../App';
import { getSocket } from '../hooks/useSocket';
import { Player } from '../types';
import Avatar from '../components/Avatar';

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { myName, room, setRoom, setPlayers, setGameState } = useAppContext();
  const socket = getSocket();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Local state for immediate re-renders
  const [localPlayers, setLocalPlayers] = useState<Player[]>(room?.players || []);
  const [hostId, setHostId] = useState<string>(room?.hostId || '');
  const [mySocketId, setMySocketId] = useState<string>(socket.id || '');

  // Keep mySocketId in sync
  useEffect(() => {
    const onConnect = () => setMySocketId(socket.id || '');
    socket.on('connect', onConnect);
    if (socket.id) setMySocketId(socket.id);
    return () => { socket.off('connect', onConnect); };
  }, [socket]);

  const isHost = hostId !== '' && mySocketId !== '' && hostId === mySocketId;

  useEffect(() => {
    if (!myName || !roomId) { navigate('/'); return; }
    if (!socket.connected) socket.connect();

    // Initialize from context if available
    if (room) {
      setLocalPlayers(room.players || []);
      setHostId(room.hostId || '');
    } else {
      fetch(`/api/rooms/${roomId}`)
        .then(r => r.json())
        .then(data => {
          if (data.room) {
            setRoom(data.room);
            setLocalPlayers(data.room.players || []);
            setHostId(data.room.hostId || '');
          } else {
            navigate('/');
          }
        })
        .catch(() => navigate('/'));
    }

    const onPlayerJoined = ({ players: updatedPlayers }: { player: Player; players: Player[] }) => {
      setLocalPlayers(updatedPlayers);
      setPlayers(updatedPlayers);
    };

    const onPlayerLeft = ({ players: updatedPlayers, newHostId }: { playerId: string; playerName: string; players: Player[]; newHostId: string }) => {
      setLocalPlayers(updatedPlayers);
      setPlayers(updatedPlayers);
      setHostId(newHostId);
    };

    const onGameState = (state: { phase: string; round: number; totalRounds: number; drawerId: string; players: Player[] }) => {
      if (state.phase !== 'lobby') {
        setGameState(state as Parameters<typeof setGameState>[0]);
        setPlayers(state.players || []);
        navigate(`/game/${roomId}`);
      }
    };

    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('game_state', onGameState);
    socket.on('round_start', () => navigate(`/game/${roomId}`));

    return () => {
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('game_state', onGameState);
      socket.off('round_start');
    };
  }, [socket, roomId, myName]);

  const handleStart = () => {
    if (localPlayers.length < 2) { setError('Need at least 2 players to start!'); return; }
    setError('');
    socket.emit('start_game', {}, (res: { success: boolean; error?: string } | undefined) => {
      if (res && !res.success) setError(res.error || 'Failed to start');
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/lobby/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const settings = room?.settings;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: 4 }}>🎨 Game Lobby</h1>
          <p style={{ color: 'var(--text2)', fontWeight: 600 }}>Waiting for players...</p>
        </div>

        {/* Room Code */}
        <div className="card" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Room Code</p>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: 6, color: 'var(--accent3)', textShadow: '0 0 20px rgba(78,205,196,0.4)', display: 'block', marginBottom: 12 }}>
            {roomId}
          </span>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={copyCode}>
              {copied ? '✅ Copied!' : '📋 Copy Code'}
            </button>
            <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={copyLink}>
              🔗 Copy Link
            </button>
          </div>
        </div>

        {/* Settings */}
        {settings && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Room Settings</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { icon: '👥', label: `${localPlayers.length}/${settings.maxPlayers} players` },
                { icon: '🔄', label: `${settings.rounds} rounds` },
                { icon: '⏱️', label: `${settings.drawTime}s draw time` },
                { icon: '📝', label: `${settings.wordCount} words` },
                { icon: '💡', label: `${settings.hints} hints` },
                { icon: settings.isPrivate ? '🔒' : '🌍', label: settings.isPrivate ? 'Private' : 'Public' },
              ].map(s => (
                <span key={s.label} className="badge badge-blue">{s.icon} {s.label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Players */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
            Players ({localPlayers.length})
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {localPlayers.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  background: 'var(--bg2)', borderRadius: 12, padding: '14px 8px',
                  border: `1px solid ${p.id === mySocketId ? 'var(--accent3)' : 'var(--border)'}`,
                  animation: 'pop 0.4s ease'
                }}
              >
                <Avatar index={p.avatar} name={p.name} size={44} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: p.id === mySocketId ? 'var(--accent3)' : 'var(--text)', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                {p.id === hostId && (
                  <span className="badge badge-yellow" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>👑 Host</span>
                )}
                {p.id === mySocketId && p.id !== hostId && (
                  <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>You</span>
                )}
              </div>
            ))}
            {settings && Array.from({ length: Math.max(0, Math.min(4, settings.maxPlayers - localPlayers.length)) }).map((_, i) => (
              <div key={`empty-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg2)', borderRadius: 12, padding: '14px 8px', border: '1px dashed var(--border)', opacity: 0.4, minHeight: 100 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>?</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Debug strip */}
        <div style={{ fontSize: '0.68rem', color: 'var(--text3)', marginBottom: 8, textAlign: 'center', fontFamily: 'monospace' }}>
          my socket: {mySocketId || '…'} | host: {hostId} | isHost: {String(isHost)}
        </div>

        {error && (
          <div style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: 'var(--accent)', fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/')}>
            ← Leave
          </button>
          {isHost ? (
            <button className="btn-primary" style={{ flex: 2 }} onClick={handleStart} disabled={localPlayers.length < 2}>
              {localPlayers.length < 2 ? '⏳ Need 2+ players' : '🎮 Start Game!'}
            </button>
          ) : (
            <div style={{ flex: 2, background: 'var(--card2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontWeight: 700, fontSize: '0.9rem' }}>
              ⏳ Waiting for host...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
