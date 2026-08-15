// server.js
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: Number(PORT) });

const rooms = new Map();

console.log(`📡 [Telegraph Server] WebSocket server listening on port ${PORT}...`);

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

      if (data.type === 'JOIN_ROOM') {
        const targetRoom = data.roomCode.trim().toUpperCase();
        leaveRoom(ws);

        if (!rooms.has(targetRoom)) {
          rooms.set(targetRoom, { clients: new Set(), lastAngle: 0 });
        }
        
        const roomData = rooms.get(targetRoom);
        roomData.clients.add(ws);
        ws.roomCode = targetRoom;

        ws.send(JSON.stringify({
          type: 'SYNC_INIT_STATE',
          angle: roomData.lastAngle,
          peerCount: roomData.clients.size,
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
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    leaveRoom(ws);
  });
});