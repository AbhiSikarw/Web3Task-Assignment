import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'https://web3task-assignment-a7r4.onrender.com';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }
    return () => {
      // Don't disconnect on unmount - maintain connection across pages
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown, callback?: (res: unknown) => void) => {
    if (callback) {
      socketRef.current.emit(event, data, callback);
    } else {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current.on(event, handler);
    return () => { socketRef.current.off(event, handler); };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    socketRef.current.off(event, handler);
  }, []);

  return { socket: socketRef.current, emit, on, off };
}
