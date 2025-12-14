'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;
let socketAuth: any = null;

export function setSocketAuth(auth: any) {
  socketAuth = auth;
  if (globalSocket && globalSocket.connected) {
    globalSocket.emit('join', auth);
  }
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        autoConnect: true,
        auth: socketAuth ? { player: socketAuth } : undefined,
      });
    }

    setSocket(globalSocket);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    globalSocket.on('connect', handleConnect);
    globalSocket.on('disconnect', handleDisconnect);

    return () => {
      if (globalSocket) {
        globalSocket.off('connect', handleConnect);
        globalSocket.off('disconnect', handleDisconnect);
      }
    };
  }, []);

  return socket;
}

export function getSocket() {
  return globalSocket;
}
