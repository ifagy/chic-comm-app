// server.js
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// Map<RoomCode, { clients: Set<WebSocket>, lastAngle: number }>
const rooms = new Map();

console.log(`📡 [Telegraph Server] WebSocket server running on ws://localhost:${PORT}...`);

function leaveRoom(ws) {
  const currentRoom = ws.roomCode;
  if (!currentRoom || !rooms.has(currentRoom)) return;

  const roomData = rooms.get(currentRoom);
  roomData.clients.delete(ws);

  console.log(`🚪 [Room] Peer left: ${currentRoom} (${roomData.clients.size} remaining)`);

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
    console.log(`🗑️ [Room] Empty room deleted: ${currentRoom}`);
  }

  ws.roomCode = null;
}

wss.on('connection', (ws) => {
  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());

      // 1. ODAYA KATILMA / DEĞİŞTİRME
      if (data.type === 'JOIN_ROOM') {
        const targetRoom = data.roomCode.trim().toUpperCase();
        leaveRoom(ws);

        if (!rooms.has(targetRoom)) {
          rooms.set(targetRoom, { clients: new Set(), lastAngle: 0 });
        }
        
        const roomData = rooms.get(targetRoom);
        roomData.clients.add(ws);
        ws.roomCode = targetRoom;

        console.log(`🔑 [Room] Peer joined: ${targetRoom} (Total: ${roomData.clients.size})`);

        // Yeni katılan istemciye mevcut oda açısını ve durumunu gönder
        ws.send(JSON.stringify({
          type: 'SYNC_INIT_STATE',
          angle: roomData.lastAngle,
          peerCount: roomData.clients.size,
          roomCode: targetRoom,
          message: roomData.clients.size > 1 ? 'Connected with partner!' : null
        }));

        // Odadaki diğer eşe yeni birinin geldiğini bildir
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

      // 2. ÇARK HAREKETİ (Son açıyı oda hafızasına yaz ve ilet)
      else if (data.type === 'WHEEL_MOVE') {
        const currentRoom = ws.roomCode;
        if (!currentRoom || !rooms.has(currentRoom)) return;

        const roomData = rooms.get(currentRoom);
        roomData.lastAngle = data.angle; // Odanın güncel açısını kaydet

        roomData.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }

      // 3. ZİL SİNYALİ
      else if (data.type === 'BELL_RING') {
        const currentRoom = ws.roomCode;
        if (!currentRoom || !rooms.has(currentRoom)) return;

        const roomData = rooms.get(currentRoom);
        roomData.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }

    } catch (err) {
      console.error('Message parse error:', err);
    }
  });

  ws.on('close', () => {
    leaveRoom(ws);
  });
});