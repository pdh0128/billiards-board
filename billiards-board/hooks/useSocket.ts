'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
        autoConnect: true,
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
