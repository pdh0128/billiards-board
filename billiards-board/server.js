const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { prisma } = require('./lib/prisma');

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

  // 연결된 플레이어 맵
  const players = new Map(); // socket.id -> { id, nickname, color, joinedAt }

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('join', (player) => {
      players.set(socket.id, { ...player, socketId: socket.id });
      io.emit('syncPlayers', Array.from(players.values()));
    });

    socket.on('disconnect', () => {
      players.delete(socket.id);
      io.emit('syncPlayers', Array.from(players.values()));
      console.log(`❌ Client disconnected: ${socket.id}`);
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
