// server.js
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Telegraph Server is Awake!');
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

const rooms = new Map();

console.log(`📡 [Telegraph Server]Server listening on port ${PORT}...`);

function leaveRoom(ws) {
  const currentRoom = ws.roomCode;
  if (!currentRoom || !rooms.has(currentRoom)) return;

  const roomData = rooms.get(currentRoom);
  roomData.clients.delete(ws);

  roomData.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'PEER_STATUS',
        peerCount: roomData.clients.size,
        message: 'Partner left the room.'
      }));
    }
  });

  if (roomData.clients.size === 0) {
    rooms.delete(currentRoom);
  }

  ws.roomCode = null;
}

wss.on('connection', (ws) => {
  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());
      
      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (data.type === 'JOIN_ROOM') {
        const targetRoom = data.roomCode.trim().toUpperCase();
        leaveRoom(ws);

        if (!rooms.has(targetRoom)) {
          rooms.set(targetRoom, { clients: new Set(), lastAngle: 0, pushSubscriptions: new Map(), notches: null });
        }
        
        const roomData = rooms.get(targetRoom);
        roomData.clients.add(ws);
        ws.roomCode = targetRoom;

        ws.send(JSON.stringify({
          type: 'SYNC_INIT_STATE',
          angle: roomData.lastAngle,
          peerCount: roomData.clients.size,
          notches: roomData.notches, // Odaya ait metinleri bağlanan kişiye gönder
          roomCode: targetRoom,
          message: roomData.clients.size > 1 ? 'Connected with partner!' : null
        }));

        roomData.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'PEER_STATUS',
              peerCount: roomData.clients.size,
              roomCode: targetRoom,
              message: 'Partner joined!'
            }));
          }
        });
      }
      else if (data.type === 'WHEEL_MOVE') {
        const currentRoom = ws.roomCode;
        if (!currentRoom || !rooms.has(currentRoom)) return;

        const roomData = rooms.get(currentRoom);
        roomData.lastAngle = data.angle;

        roomData.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
      else if (data.type === 'BELL_RING') {
        const currentRoom = ws.roomCode;
        if (!currentRoom || !rooms.has(currentRoom)) return;

        const roomData = rooms.get(currentRoom);
        roomData.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'BELL_RING',
              statusLabel: data.statusLabel || '',
              timestamp: Date.now()
            }));
          }
        });        
      }

      else if (data.type === 'UPDATE_NOTCHES') {
        const currentRoom = ws.roomCode;
        if (!currentRoom || !rooms.has(currentRoom)) return;

        const roomData = rooms.get(currentRoom);
        roomData.notches = data.notches; // Metinleri sunucu hafızasındaki odaya kaydet

        // Odadaki diğer kişilere yeni metinleri canlı olarak gönder
        roomData.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'SYNC_NOTCHES', notches: data.notches }));
          }
        });
      }
      
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    leaveRoom(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Server successfully started.`);
});