// Temi 실시간 위치/명령/포토부스 중계 서버
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
let lastPhotoResult = null; // health 확인용으로만 보관. 새 app 연결 시 자동 재전송하지 않는다.

let stampState = {
  updatedAt: null,
  last: null,
  claims: [],
};

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    temi: temiStatus,
    lastCommand,
    lastPhotoResult,
    stampState,
    rooms: {
      temi: io.sockets.adapter.rooms.get('temi')?.size || 0,
      app: io.sockets.adapter.rooms.get('app')?.size || 0,
    },
  });
});

function normalizeRoom(raw) {
  return String(raw || '').trim().toLowerCase();
}

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
    case 'home base':
    case '홈':
    case '홈복귀':
    case '메인홀':
    case '테미':
    case '테미부르기':
      return 'homebase';

    default:
      return key;
  }
}

function getRoomCount(roomName) {
  return io.sockets.adapter.rooms.get(roomName)?.size || 0;
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

  // 모바일 웹이 보낸 이동 명령을 Temi 앱 방으로 전달
  io.to('temi').emit('temi:goto', command);

  // 모든 모바일 웹에 명령 상태도 알려준다.
  io.to('app').emit('app:command_sent', command);

  console.log(`[명령] app -> temi:goto ${target}`);
  return {
    ok: true,
    command,
    temiClients: getRoomCount('temi'),
    appClients: getRoomCount('app'),
  };
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
  return {
    ok: true,
    command,
    temiClients: getRoomCount('temi'),
    appClients: getRoomCount('app'),
  };
}

function forwardPhotoBoothStart(rawPayload, sourceSocketId) {
  const payload = typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {};

  const command = {
    type: 'photo_booth_start',
    mode: payload.mode || 'fourcut',
    requestedAt: new Date().toISOString(),
    sourceSocketId,
    raw: payload,
  };

  lastCommand = command;

  // 모바일 웹이 보낸 포토부스 시작 명령을 Temi 앱 방으로 전달
  io.to('temi').emit('temi:photo_booth_start', command);

  // 모든 모바일 웹에 명령 상태도 알려준다.
  io.to('app').emit('app:command_sent', command);

  console.log('[명령] app -> temi:photo_booth_start');
  return {
    ok: true,
    command,
    temiClients: getRoomCount('temi'),
    appClients: getRoomCount('app'),
  };
}

function forwardPhotoResult(rawPayload, sourceSocketId) {
  const payload = typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {};

  const result = {
    ...payload,
    type: 'photo_result',
    receivedAt: new Date().toISOString(),
    sourceSocketId,
  };

  lastPhotoResult = result;

  // Temi photo-capture.html이 보낸 촬영 결과를 모바일 웹으로 전달
  io.to('app').emit('app:photo_result', result);

  console.log('[사진] temi -> app:photo_result', result);
  return {
    ok: true,
    result,
    appClients: getRoomCount('app'),
  };
}


function normalizeStampCode(raw) {
  let value = String(raw || '').trim();

  if (!value) return '';

  try {
    const parsed = new URL(value.includes('://') ? value : `http://local${value}`);
    const claim = parsed.searchParams.get('claim');
    if (claim && claim.trim()) {
      value = claim.trim();
    }
  } catch (e) {}

  const compact = value.replace(/\s+/g, '').toUpperCase();

  switch (compact) {
    case 'RALLY-1':
    case 'RALLY1':
    case 'STAMP-1':
    case 'STAMP1':
    case 'A':
    case 'ZONE_A':
    case '1':
    case '1구역':
      return 'RALLY-1';

    case 'RALLY-2':
    case 'RALLY2':
    case 'STAMP-2':
    case 'STAMP2':
    case 'B':
    case 'ZONE_B':
    case '2':
    case '2구역':
      return 'RALLY-2';

    case 'RALLY-3':
    case 'RALLY3':
    case 'STAMP-3':
    case 'STAMP3':
    case 'C':
    case 'ZONE_C':
    case '3':
    case '3구역':
      return 'RALLY-3';

    case 'RALLY-4':
    case 'RALLY4':
    case 'STAMP-4':
    case 'STAMP4':
    case 'D':
    case 'ZONE_D':
    case '4':
    case '4구역':
      return 'RALLY-4';

    default:
      return compact;
  }
}

function applyStampUpdate(rawPayload, sourceSocketId) {
  const payload = typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {};
  const code = normalizeStampCode(
    payload.qrValue ||
    payload.claim ||
    payload.code ||
    payload.spotCode ||
    payload.stampCode ||
    payload.id
  );

  if (!code) {
    return { ok: false, message: 'empty stamp code' };
  }

  const now = new Date().toISOString();
  const claim = {
    type: 'stamp_update',
    code,
    qrValue: payload.qrValue || code,
    result: payload.result || null,
    source: payload.source || 'mobile-web',
    sourceSocketId,
    receivedAt: now,
  };

  const exists = stampState.claims.some((item) => item.code === code);
  if (!exists) {
    stampState.claims.push(claim);
  } else {
    stampState.claims = stampState.claims.map((item) => (item.code === code ? { ...item, ...claim } : item));
  }

  stampState.last = claim;
  stampState.updatedAt = now;

  const status = {
    ...stampState,
    total: 4,
    collectedCount: stampState.claims.length,
    completed: stampState.claims.length >= 4,
  };

  io.to('app').emit('app:stamp_status', status);
  io.to('app').emit('app:stamp_update', claim);

  console.log(`[스탬프] ${code} 적립/갱신 collected=${status.collectedCount}/${status.total}`);

  return {
    ok: true,
    claim,
    status,
    appClients: getRoomCount('app'),
  };
}

function resetStampState(sourceSocketId) {
  stampState = {
    updatedAt: new Date().toISOString(),
    last: null,
    claims: [],
  };

  const status = {
    ...stampState,
    total: 4,
    collectedCount: 0,
    completed: false,
    sourceSocketId,
  };

  io.to('app').emit('app:stamp_status', status);
  console.log('[스탬프] 상태 초기화');

  return { ok: true, status };
}


io.on('connection', (socket) => {
  const room = normalizeRoom(socket.handshake.query?.room);

  console.log(`[연결] ${room || 'unknown'} (${socket.id})`);

  if (room === 'temi') {
    socket.join('temi');

    temiStatus.connected = true;

    io.to('app').emit('app:temi_connected', { connected: true });
    socket.emit('temi:connected', { ok: true });

    console.log(`[Temi] 연결됨 / temi room clients=${getRoomCount('temi')}`);
  } else if (room === 'app') {
    socket.join('app');

    socket.emit('app:temi_status', temiStatus);

    if (lastCommand) {
      socket.emit('app:command_sent', lastCommand);
    }

    socket.emit('app:stamp_status', {
      ...stampState,
      total: 4,
      collectedCount: stampState.claims.length,
      completed: stampState.claims.length >= 4,
    });

    console.log(`[모바일 웹] 연결됨 / app room clients=${getRoomCount('app')}`);
  } else {
    socket.emit('server:warning', {
      message: 'room query is missing. Use ?room=temi or ?room=app',
    });
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

  // 모바일 웹 이동 명령 수신 → Temi 앱으로 중계
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

  // 모바일 웹 포토부스 명령 수신 → Temi 앱으로 중계
  socket.on('app:photo_booth_start', (payload, ack) => {
    const result = forwardPhotoBoothStart(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  // 혹시 모바일 쪽 이벤트 이름이 다를 경우를 대비한 별칭
  socket.on('app:photo_start', (payload, ack) => {
    const result = forwardPhotoBoothStart(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  socket.on('app:camera_start', (payload, ack) => {
    const result = forwardPhotoBoothStart(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  // Temi 촬영 완료 결과 수신 → 모바일 웹으로 중계
  socket.on('temi:photo_result', (payload, ack) => {
    const result = forwardPhotoResult(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });


  // 모바일 스탬프 적립/스캔 수신 → 모든 모바일 웹으로 상태 중계
  socket.on('app:stamp_update', (payload, ack) => {
    const result = applyStampUpdate(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  socket.on('app:stamp_scan', (payload, ack) => {
    const result = applyStampUpdate(payload, socket.id);
    if (typeof ack === 'function') ack(result);
  });

  socket.on('app:stamp_reset', (payload, ack) => {
    const result = resetStampState(socket.id);
    if (typeof ack === 'function') ack(result);
  });

  socket.on('disconnect', (reason) => {
    if (room === 'temi') {
      setTimeout(() => {
        const remaining = getRoomCount('temi');
        temiStatus.connected = remaining > 0;

        io.to('app').emit('app:temi_connected', {
          connected: temiStatus.connected,
          clients: remaining,
          reason,
        });

        if (remaining > 0) {
          console.log(`[Temi] 기존 소켓 해제, 다른 Temi 연결 유지 clients=${remaining} reason=${reason}`);
        } else {
          console.log(`[Temi] 연결 해제 clients=0 reason=${reason}`);
        }
      }, 700);
    } else if (room === 'app') {
      setTimeout(() => {
        console.log(`[모바일 웹] 연결 해제 / app room clients=${getRoomCount('app')} reason=${reason}`);
      }, 300);
    } else {
      console.log(`[연결 해제] ${socket.id} reason=${reason}`);
    }
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('\n=====================================');
  console.log('  Temi Socket Server  :3000');
  console.log('=====================================');
  console.log('수신: temi:position              (Temi 앱 → 서버)');
  console.log('송신: app:temi_position          (서버 → 모바일 웹)');
  console.log('수신: app:goto / app:guide_start (모바일 웹 → 서버)');
  console.log('송신: temi:goto                  (서버 → Temi 앱)');
  console.log('수신: app:photo_booth_start      (모바일 웹 → 서버)');
  console.log('송신: temi:photo_booth_start     (서버 → Temi 앱)');
  console.log('수신: temi:photo_result          (Temi UI → 서버)');
  console.log('송신: app:photo_result           (서버 → 모바일 웹)');
  console.log('수신: app:stamp_update / app:stamp_scan (모바일 웹 → 서버)');
  console.log('송신: app:stamp_status / app:stamp_update (서버 → 모바일 웹)');
  console.log('확인: http://서버IP:3000/health\n');
});
