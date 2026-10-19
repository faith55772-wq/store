import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to server, id:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.warn('[Socket.IO] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('[Socket.IO] Connect error:', err.message);
    });
  }

  return socketInstance;
}
