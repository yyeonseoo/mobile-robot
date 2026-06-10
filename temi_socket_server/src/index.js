// Temi 실시간 위치/명령 중계 서버
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

let temiStatus = {
  connected: false,
  x: 0,
  y: 0,
  yaw: 0,
  updatedAt: null,
  locationId: '',
  navState: 'idle',
  timestamp: null,
};

let lastCommand = null;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', temi: temiStatus, lastCommand });
});

function normalizeTarget(raw) {
  const key = String(raw || '').trim().replace(/\s+/g, '');

  switch (key) {
    case 'a':
    case 'A':
    case 'a존':
    case 'A존':
    case 'zone_a':
    case 'ZONE_A':
    case '1':
    case '1구역':
      return 'a';

    case 'b':
    case 'B':
    case 'b존':
    case 'B존':
    case 'zone_b':
    case 'ZONE_B':
    case '2':
    case '2구역':
      return 'b';

    case 'c':
    case 'C':
    case 'c존':
    case 'C존':
    case 'zone_c':
    case 'ZONE_C':
    case '3':
    case '3구역':
      return 'c';

    case 'd':
    case 'D':
    case 'd존':
    case 'D존':
    case 'zone_d':
    case 'ZONE_D':
    case '4':
    case '4구역':
      return 'd';

    case 'home':
    case 'HOME':
    case 'homebase':
    case 'HOMEBASE':
    case 'home_base':
    case '홈':
    case '메인홀':
      return 'homebase';

    default:
      return key;
  }
}

function forwardGotoCommand(rawPayload, sourceSocketId) {
  const payload = typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {};
  const target = normalizeTarget(payload.locationId || payload.target || payload.zone || payload.id);

  if (!target) {
    return { ok: false, message: 'empty target' };
  }

  const command = {
    type: 'goto',
    locationId: target,
    requestedAt: new Date().toISOString(),
    sourceSocketId,
    raw: payload,
  };

  lastCommand = command;

  // 모바일 웹이 보낸 명령을 Temi 앱 방으로 전달
  io.to('temi').emit('temi:goto', command);

  // 모든 모바일 웹에 명령 상태도 알려준다.
  io.to('app').emit('app:command_sent', command);

  console.log(`[명령] app -> temi:goto ${target}`);
  return { ok: true, command };
}

function forwardStopCommand(rawPayload, sourceSocketId) {
  const payload = typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {};
  const command = {
    type: 'stop',
    requestedAt: new Date().toISOString(),
    sourceSocketId,
    raw: payload,
  };

  lastCommand = command;
  io.to('temi').emit('temi:stop', command);
  io.to('app').emit('app:command_sent', command);

  console.log('[명령] app -> temi:stop');
  return { ok: true, command };
}

io.on('connection', (socket) => {
  const { room } = socket.handshake.query;
  console.log(`[연결] ${room} (${socket.id})`);

  if (room === 'temi') {
    socket.join('temi');
    temiStatus.connected = true;
    io.to('app').emit('app:temi_connected', { connected: true });
    socket.emit('temi:connected', { ok: true });
    console.log('[Temi] 연결됨');
  } else if (room === 'app') {
    socket.join('app');
    socket.emit('app:temi_status', temiStatus);
    if (lastCommand) socket.emit('app:command_sent', lastCommand);
    console.log('[모바일 웹] 연결됨');
  }

  // Temi 위치 수신 → 모바일 웹으로 중계
  socket.on('temi:position', (data) => {
    temiStatus = {
      ...temiStatus,
      ...(typeof data === 'object' && data !== null ? data : {}),
      connected: true,
      updatedAt: new Date().toISOString(),
    };

    io.to('app').emit('app:temi_position', temiStatus);
    console.log(
      `[위치] ${temiStatus.locationId || '-'} ${temiStatus.navState || '-'} x=${temiStatus.x} y=${temiStatus.y} yaw=${temiStatus.yaw}`
    );
  });

  // 모바일 웹 명령 수신 → Temi 앱으로 중계
  socket.on('app:goto', (payload, ack) => {
    const result = forwardGotoCommand(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  socket.on('app:guide_start', (payload, ack) => {
    const result = forwardGotoCommand(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  socket.on('app:stop', (payload, ack) => {
    const result = forwardStopCommand(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  socket.on('disconnect', () => {
    if (room === 'temi') {
      temiStatus.connected = false;
      io.to('app').emit('app:temi_connected', { connected: false });
      console.log('[Temi] 연결 해제');
    } else if (room === 'app') {
      console.log('[모바일 웹] 연결 해제');
    }
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('\n=====================================');
  console.log('  Temi Socket Server  :3000');
  console.log('=====================================');
  console.log('수신: temi:position       (Temi 앱 → 서버)');
  console.log('송신: app:temi_position   (서버 → 모바일 웹)');
  console.log('수신: app:goto            (모바일 웹 → 서버)');
  console.log('송신: temi:goto           (서버 → Temi 앱)\n');
});
