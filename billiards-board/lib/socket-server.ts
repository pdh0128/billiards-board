import { Server as SocketIOServer } from 'socket.io';

// global io 인스턴스를 가져옴 (server.js에서 설정됨)
function getIO(): SocketIOServer | null {
  if (typeof global !== 'undefined' && (global as any).io) {
    return (global as any).io;
  }
  return null;
}

// 브로드캐스트 헬퍼 함수들
export function broadcastArticleCreated(article: any) {
  const io = getIO();
  if (io) {
    io.emit('createArticle', article);
    console.log('📢 Broadcasted createArticle:', article.id);
  } else {
    console.warn('⚠️  Socket.IO not available for broadcast');
  }
}

export function broadcastCommentCreated(comment: any) {
  const io = getIO();
  if (io) {
    io.emit('createComment', comment);
    console.log('📢 Broadcasted createComment:', comment.id);
  }
}

export function broadcastArticleDeleted(articleId: string) {
  const io = getIO();
  if (io) {
    io.emit('deleteArticle', { id: articleId });
    console.log('📢 Broadcasted deleteArticle:', articleId);
  }
}

export function broadcastCommentDeleted(commentId: string) {
  const io = getIO();
  if (io) {
    io.emit('deleteComment', { id: commentId });
    console.log('📢 Broadcasted deleteComment:', commentId);
  }
}
