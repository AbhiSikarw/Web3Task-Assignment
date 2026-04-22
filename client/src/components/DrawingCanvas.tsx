import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getSocket } from '../hooks/useSocket';
import { StrokeData } from '../types';

interface DrawingCanvasProps {
  isDrawer: boolean;
  canvasStrokes?: StrokeData[];
}

const COLORS = [
  '#000000', '#ffffff', '#e94560', '#f5a623', '#f7dc6f',
  '#2ecc71', '#4ecdc4', '#45b7d1', '#a855f7', '#ec4899',
  '#8B4513', '#808080', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#4d96ff', '#c77dff', '#ff9a9e', '#ffeaa7', '#a8e6cf'
];
const SIZES = [3, 6, 10, 16, 24];

export default function DrawingCanvas({ isDrawer, canvasStrokes }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawingLocal, setIsDrawingLocal] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });

  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const strokesRef = useRef<StrokeData[]>([]);

  // Resize canvas to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.min(w * 0.625, 520);
        setCanvasSize({ w, h });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Redraw all strokes from array
  const redrawStrokes = useCallback((strokes: StrokeData[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentPath: { color: string; size: number } | null = null;

    for (const s of strokes) {
      if (s.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(s.x * canvas.width, s.y * canvas.height);
        ctx.strokeStyle = s.color || '#000000';
        ctx.lineWidth = (s.size || 6) * (canvas.width / 800);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        currentPath = { color: s.color || '#000000', size: s.size || 6 };
      } else if (s.type === 'move' && currentPath) {
        ctx.lineTo(s.x * canvas.width, s.y * canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s.x * canvas.width, s.y * canvas.height);
      } else if (s.type === 'end') {
        ctx.stroke();
        currentPath = null;
      }
    }
  }, []);

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasSize]);

  // Receive remote drawing events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleDrawData = (data: StrokeData) => {
      if (isDrawer) return; // Drawer draws locally

      if (data.type === 'start') {
        ctx.beginPath();
        ctx.moveTo(data.x * canvas.width, data.y * canvas.height);
        ctx.strokeStyle = data.color || '#000000';
        ctx.lineWidth = (data.size || 6) * (canvas.width / 800);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        lastPos.current = { x: data.x * canvas.width, y: data.y * canvas.height };
      } else if (data.type === 'move') {
        ctx.lineTo(data.x * canvas.width, data.y * canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.x * canvas.width, data.y * canvas.height);
      } else if (data.type === 'end') {
        ctx.stroke();
      }
    };

    const handleClear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleUndo = ({ strokes }: { strokes: StrokeData[] }) => {
      strokesRef.current = strokes;
      redrawStrokes(strokes);
    };

    socket.on('draw_data', handleDrawData);
    socket.on('canvas_clear', handleClear);
    socket.on('draw_undo', handleUndo);

    return () => {
      socket.off('draw_data', handleDrawData);
      socket.off('canvas_clear', handleClear);
      socket.off('draw_undo', handleUndo);
    };
  }, [socket, isDrawer, redrawStrokes]);

  // Replay strokes when we get them (e.g. on reconnect)
  useEffect(() => {
    if (canvasStrokes && canvasStrokes.length > 0) {
      strokesRef.current = canvasStrokes;
      redrawStrokes(canvasStrokes);
    }
  }, [canvasStrokes, redrawStrokes]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: ((touch.clientX - rect.left) * scaleX) / canvas.width,
        y: ((touch.clientY - rect.top) * scaleY) / canvas.height
      };
    }
    return {
      x: ((e.clientX - rect.left) * scaleX) / canvas.width,
      y: ((e.clientY - rect.top) * scaleY) / canvas.height
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    setIsDrawingLocal(true);

    const actualColor = isEraser ? '#ffffff' : color;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(pos.x * canvas.width, pos.y * canvas.height);
    ctx.strokeStyle = actualColor;
    ctx.lineWidth = brushSize * (canvas.width / 800);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    lastPos.current = { x: pos.x * canvas.width, y: pos.y * canvas.height };

    socket.emit('draw_start', { x: pos.x, y: pos.y, color: actualColor, size: brushSize });
  };

  const continueDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawingLocal) return;
    e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.lineTo(pos.x * canvas.width, pos.y * canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x * canvas.width, pos.y * canvas.height);
    lastPos.current = { x: pos.x * canvas.width, y: pos.y * canvas.height };

    socket.emit('draw_move', { x: pos.x, y: pos.y });
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawingLocal) return;
    e.preventDefault();
    setIsDrawingLocal(false);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.stroke();
    socket.emit('draw_end', {});
  };

  const handleClear = () => {
    if (!isDrawer) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('canvas_clear');
  };

  const handleUndo = () => {
    if (!isDrawer) return;
    socket.emit('draw_undo');
  };

  const activeColor = isEraser ? '#ffffff' : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: '3px solid var(--border)',
          background: '#fff',
          cursor: isDrawer ? (isEraser ? 'cell' : 'crosshair') : 'default',
          boxShadow: isDrawer ? '0 0 0 2px var(--accent3)' : 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={continueDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={continueDraw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Tools - only shown to drawer */}
      {isDrawer && (
        <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Color palette */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsEraser(false); }}
                style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: `3px solid ${color === c && !isEraser ? 'var(--accent3)' : 'rgba(255,255,255,0.15)'}`,
                  boxShadow: color === c && !isEraser ? `0 0 8px ${c}` : 'none',
                  transform: color === c && !isEraser ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.15s',
                  outline: c === '#ffffff' ? '1px solid rgba(200,200,200,0.5)' : 'none'
                }}
              />
            ))}
          </div>

          {/* Bottom row: sizes + tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Brush sizes */}
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: 'var(--bg2)', borderRadius: 8, padding: '6px 10px' }}>
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: brushSize === s ? 'var(--accent3)' : 'var(--bg3)',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <div style={{ width: Math.max(3, s * 0.7), height: Math.max(3, s * 0.7), borderRadius: '50%', background: brushSize === s ? '#0f3460' : activeColor === '#ffffff' ? '#888' : activeColor }} />
                </button>
              ))}
            </div>

            {/* Eraser */}
            <button
              onClick={() => setIsEraser(e => !e)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem',
                background: isEraser ? 'var(--accent)' : 'var(--bg2)',
                color: isEraser ? 'white' : 'var(--text2)',
                border: `1px solid ${isEraser ? 'var(--accent)' : 'var(--border)'}`
              }}
            >
              ✏️ Eraser
            </button>

            {/* Undo */}
            <button
              onClick={handleUndo}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              ↩️ Undo
            </button>

            {/* Clear */}
            <button
              onClick={handleClear}
              style={{ padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', background: 'rgba(233,69,96,0.15)', color: 'var(--accent)', border: '1px solid rgba(233,69,96,0.3)' }}
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
