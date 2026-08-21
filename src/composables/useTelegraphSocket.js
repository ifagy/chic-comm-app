// src/composables/useTelegraphSocket.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useTelegraphNotifications } from './useTelegraphNotifications';
import { NOTCHES as DEFAULT_NOTCHES } from '../config/telegraphNotches';

const STORAGE_KEY = 'chic_telegraph_last_room';

function generateRandomRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Önce URL'e bak, 2. Yoksa localStorage'a bak, 3. İkisi de yoksa yeni üret
function getInitialRoomCode() {
  if (typeof window !== 'undefined') {
    // 1. Öncelik: URL Query Parametresi (?room=...)
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.trim().length > 0) {
      const cleanUrlCode = roomParam.trim().toUpperCase();
      localStorage.setItem(STORAGE_KEY, cleanUrlCode);
      return cleanUrlCode;
    }

    // 2. Öncelik: Cihazda kayıtlı son oda
    const savedRoom = localStorage.getItem(STORAGE_KEY);
    if (savedRoom && savedRoom.trim().length > 0) {
      return savedRoom.trim().toUpperCase();
    }
  }

  // 3. Öncelik: İlk defa açılıyorsa yeni üret ve kaydet
  const newCode = generateRandomRoomCode();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, newCode);
  }
  return newCode;
}

export function useTelegraphSocket(wheelEngine, roomNotches) {
  const isConnected = ref(false);
  const currentRoomCode = ref(getInitialRoomCode());
  const peerCount = ref(1);
  const tempMessage = ref('');
  const statusMessage = ref('Connecting to server...');

  const { showBellNotification, requestPermission } = useTelegraphNotifications();

  let messageTimer = null;
  let pingInterval = null;
  let socket = null;
  let connectionAttempts = 0;

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

  const updateUrlAndStorage = (code) => {
    if (typeof window !== 'undefined') {
      // 1. LocalStorage'a kalıcı olarak yaz
      localStorage.setItem(STORAGE_KEY, code);

      // 2. URL'i güncelle
      if (window.history.pushState) {
        const url = new URL(window.location);
        url.searchParams.set('room', code);
        window.history.pushState({}, '', url);
      }
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

    
    if (cleanCode.length !== 8) {
      showNotification('Room code must be 8 characters');
      return;
    }
    
    currentRoomCode.value = cleanCode;
    updateUrlAndStorage(cleanCode); // Hafızaya ve URL'e kaydet

    wheelEngine.triggerJoinHaptic?.();

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'JOIN_ROOM',
        roomCode: cleanCode
      }));
    }
  };

  const leaveAndCreateNewRoom = () => {
    const newCode = generateRandomRoomCode();

    wheelEngine.triggerRoomCreateHaptic?.();

    joinRoom(newCode);
    showNotification('New room generated');
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}?room=${currentRoomCode.value}`;
    navigator.clipboard.writeText(shareUrl);
    showNotification('Link copied! 📋');
  };

  const sendNotches = (newNotches) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'UPDATE_NOTCHES', notches: newNotches }));
    }
  };

  const connect = () => {
    socket = new WebSocket(WS_URL);
    connectionAttempts++;

    if (connectionAttempts > 1) {
      statusMessage.value = 'Waking up server...';
      showNotification('Server is waking up...');
    }

    socket.onopen = () => {
      isConnected.value = true;
      connectionAttempts = 0;
      statusMessage.value = 'Connected';
      
      // Her bağlandığında hafızadaki son odaya otomatik gir
      joinRoom(currentRoomCode.value);

      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30000);
    };

    socket.onclose = () => {
      isConnected.value = false;
      peerCount.value = 1;
      if (pingInterval) clearInterval(pingInterval);
      statusMessage.value = 'Reconnecting...';
      setTimeout(connect, 3000);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PONG') return;

        if (data.type === 'SYNC_INIT_STATE') {
          peerCount.value = data.peerCount;

          if (data.notches) {
            roomNotches.value = data.notches;
          } else {
            roomNotches.value = JSON.parse(JSON.stringify(DEFAULT_NOTCHES));
          }

          wheelEngine.applyRemoteAngle(data.angle, false);
          if (data.message) {
            showNotification(data.message);
            if (data.peerCount > 1) {
              wheelEngine.triggerJoinHaptic?.();
            }
          }
          
        }

        if (data.type === 'SYNC_NOTCHES') {
          roomNotches.value = data.notches;
          showNotification('Markers updated by partner');
        }

        if (data.type === 'PEER_STATUS') {
          const previousCount = peerCount.value;
          peerCount.value = data.peerCount;
          if (data.message) showNotification(data.message);

          if (data.peerCount > previousCount) {
            wheelEngine.triggerJoinHaptic?.(); 
          } else if (data.peerCount < previousCount) {
            wheelEngine.triggerLeaveHaptic?.();
          }

        }

        if (data.type === 'WHEEL_MOVE') {
          wheelEngine.applyRemoteAngle(data.angle, data.isDragging);
        }

        if (data.type === 'BELL_RING') {
          wheelEngine.triggerRemoteBell();
          showBellNotification(data.statusLabel);
        }
      } catch (err) {
        console.error('Socket message error:', err);
      }
    };
  };

  // Mobil cihaz arkaplandan öne geldiğinde bağlantıyı tazeleme kontrolü
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        connect();
      }
    }
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
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    if (socket) socket.close();
    if (pingInterval) clearInterval(pingInterval);
    if (messageTimer) clearTimeout(messageTimer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    isConnected,
    currentRoomCode,
    peerCount,
    tempMessage,
    statusMessage,
    joinRoom,
    leaveAndCreateNewRoom,
    copyShareLink,
    sendAngle,
    sendBell,
    sendNotches
  };
}