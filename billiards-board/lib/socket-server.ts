import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './prisma';

let io: SocketIOServer | null = null;

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 초기 상태 동기화 요청
    socket.on('requestSync', async () => {
      try {
        const articles = await prisma.article.findMany({
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const comments = await prisma.comment.findMany({
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        socket.emit('syncState', { articles, comments });
      } catch (error) {
        console.error('Sync error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// 브로드캐스트 헬퍼 함수들
export function broadcastArticleCreated(article: any) {
  if (io) {
    io.emit('createArticle', article);
  }
}

export function broadcastCommentCreated(comment: any) {
  if (io) {
    io.emit('createComment', comment);
  }
}

export function broadcastArticleDeleted(articleId: string) {
  if (io) {
    io.emit('deleteArticle', { id: articleId });
  }
}

export function broadcastCommentDeleted(commentId: string) {
  if (io) {
    io.emit('deleteComment', { id: commentId });
  }
}
