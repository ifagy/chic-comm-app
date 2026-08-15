// src/composables/useTelegraphSocket.js
import { ref, onMounted, onUnmounted } from 'vue';

function generateRandomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// URL'den (?room=...) parametresini okur
function getInitialRoomCode() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim().length > 0) {
      return roomParam.trim().toUpperCase();
    }
  }
  return generateRandomRoomCode();
}

export function useTelegraphSocket(wheelEngine) {
  const isConnected = ref(false);
  const currentRoomCode = ref(getInitialRoomCode());
  const peerCount = ref(1);
  const tempMessage = ref('');
  let messageTimer = null;
  let socket = null;
  const statusMessage = ref('Connecting to server...'); 
  let pingInterval = null;
  let connectionAttempts = 0;

  // Ortam değişkeninden (Production vs Localhost) WSS adresini al
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

  const updateUrlWithRoom = (code) => {
    if (typeof window !== 'undefined' && window.history.pushState) {
      const url = new URL(window.location);
      url.searchParams.set('room', code);
      window.history.pushState({}, '', url);
    }
  };

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
    updateUrlWithRoom(cleanCode);

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

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}?room=${currentRoomCode.value}`;
    navigator.clipboard.writeText(shareUrl);
    showNotification('Link copied to clipboard! 📋');
  };

  const connect = () => {
    socket = new WebSocket(WS_URL);
    connectionAttempts++;

    if (connectionAttempts > 1) {
      statusMessage.value = 'Waking up server (can take 30s)...';
      showNotification('Server is cold-starting, please wait.');
    }

    socket.onopen = () => {
      isConnected.value = true;
      connectionAttempts = 0;
      joinRoom(currentRoomCode.value);

      pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30000);
    };

    socket.onclose = () => {
      isConnected.value = false;
      peerCount.value = 1;
      showNotification('Disconnected');
      setTimeout(connect, 2500);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'PONG') return;

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
          showBellNotification(data.statusLabel);
        }
      } catch (err) {
        console.error('Socket message parse error:', err);
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

  const sendBell = (statusLabel) => {
    try {
      requestPermission();
    } catch (e) {}

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'BELL_RING',
        statusLabel: statusLabel || '',
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
    copyShareLink,
    sendAngle,
    sendBell
  };
}