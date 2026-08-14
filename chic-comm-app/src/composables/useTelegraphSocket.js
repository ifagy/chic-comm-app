// src/composables/useTelegraphSocket.js
import { ref, onMounted, onUnmounted } from 'vue';

// 8 Karakterli Alfanumerik Kod Üretici (Örn: "K9X2M7P4")
function generateRandomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Okuması kolay karakterler
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useTelegraphSocket(wheelEngine) {
  const isConnected = ref(false);
  const currentRoomCode = ref(generateRandomRoomCode());
  const peerCount = ref(1);
  const tempMessage = ref('');
  let messageTimer = null;
  let socket = null;

  const showNotification = (msg) => {
    if (!msg) return;
    tempMessage.value = msg;
    if (messageTimer) clearTimeout(messageTimer);
    messageTimer = setTimeout(() => {
      tempMessage.value = '';
    }, 3000);
  };

  const joinRoom = (code) => {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    currentRoomCode.value = cleanCode;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: cleanCode
      }));
    }
  };

  const leaveAndCreateNewRoom = () => {
    const newCode = generateRandomRoomCode();
    joinRoom(newCode);
    showNotification('New room generated');
  };

  const connect = () => {
    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      isConnected.value = true;
      joinRoom(currentRoomCode.value);
    };

    socket.onclose = () => {
      isConnected.value = false;
      peerCount.value = 1;
      showNotification('Disconnected');
      setTimeout(connect, 2000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'SYNC_INIT_STATE') {
          peerCount.value = data.peerCount;
          wheelEngine.applyRemoteAngle(data.angle, false);
          if (data.message) showNotification(data.message);
        }

        if (data.type === 'PEER_STATUS') {
          peerCount.value = data.peerCount;
          if (data.message) showNotification(data.message);
        }

        if (data.type === 'WHEEL_MOVE') {
          wheelEngine.applyRemoteAngle(data.angle, data.isDragging);
        }

        if (data.type === 'BELL_RING') {
          wheelEngine.triggerRemoteBell();
        }
      } catch (err) {
        console.error('Failed to parse socket payload:', err);
      }
    };
  };

  const sendAngle = (angle, isDragging) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'WHEEL_MOVE',
        angle,
        isDragging
      }));
    }
  };

  const sendBell = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'BELL_RING',
        timestamp: Date.now()
      }));
    }
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    if (socket) socket.close();
    if (messageTimer) clearTimeout(messageTimer);
  });

  return {
    isConnected,
    currentRoomCode,
    peerCount,
    tempMessage,
    joinRoom,
    leaveAndCreateNewRoom,
    sendAngle,
    sendBell
  };
}