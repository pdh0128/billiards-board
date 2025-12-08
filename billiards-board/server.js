const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO 서버 설정
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // 연결된 클라이언트 수
  let connectedClients = 0;

  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`✅ Client connected: ${socket.id} (Total: ${connectedClients})`);

    // 초기 상태 동기화 요청
    socket.on('requestSync', async () => {
      try {
        // Prisma는 서버 사이드에서만 사용 가능
        // API를 통해 데이터를 가져오거나, 여기서 직접 Prisma를 사용
        console.log('Sync state requested by:', socket.id);
        // socket.emit('syncState', { articles: [], comments: [] });
      } catch (error) {
        console.error('Sync error:', error);
      }
    });

    socket.on('disconnect', () => {
      connectedClients--;
      console.log(`❌ Client disconnected: ${socket.id} (Total: ${connectedClients})`);
    });
  });

  // 글로벌 io 인스턴스 저장
  global.io = io;

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server ready`);
    });
});
