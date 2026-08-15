<!-- src/App.vue -->
<template>
  <main class="app-layout">
    
    <!-- MINIMAL & STRICT SESSION BAR -->
    <header class="room-bar">
      <div class="peer-badge" :class="{ 'online': socketEngine.peerCount.value > 1 }">
        <span class="led"></span>
        <span class="peer-text">
          {{ socketEngine.tempMessage.value || `${socketEngine.peerCount.value} ${socketEngine.peerCount.value === 1 ? 'In Room' : 'In Room'}` }}
        </span>
      </div>
    
      <div class="code-editor-wrap">
        <input 
          ref="codeinputRef"
          v-model="editCode"
          class="inline-code-input"
          spellcheck="false"
          maxlength="8"
          @focus="onFocus"
          @blur="onBlur"
          @keydown.enter="submitRoomChange"
          @keydown.esc="revertRoomChange"
        />
        <button 
          v-if="isEditing && editCode.trim() !== socketEngine.currentRoomCode.value" 
          class="confirm-btn" 
          @mousedown.prevent="submitRoomChange"
          title="Join this room"
        >
          ✓
        </button>
      </div>
    
      <!-- SHARE LINK BUTTON -->
      <button 
        class="icon-btn" 
        @click="socketEngine.copyShareLink" 
        title="Copy invitation link"
      >
        <span class="btn-icon">🔗</span>
      </button>
    
      <!-- REFRESH / NEW ROOM BUTTON -->
      <button 
        class="icon-btn" 
        @click="socketEngine.leaveAndCreateNewRoom" 
        title="Leave and generate new room"
      >
        <span class="btn-icon">↺</span>
      </button>
    </header>

    <StatusDisplay :status="wheelEngine.currentStatus.value" />

    <TelegraphWheel
      :size="440"
      :current-angle="wheelEngine.currentAngle.value"
      :wheel-engine="wheelEngine"
    />

    <div class="controls">
      <button 
        class="bell-btn" 
        :class="{ 'ringing': wheelEngine.isBellRinging.value }"
        @click="wheelEngine.ringBell"
      >
        <span class="bell-icon">🔔</span>
        <span class="bell-text">RING BELL</span>
      </button>
    </div>

    <footer class="telemetry">
      <span>{{ wheelEngine.currentStatus.value.group || 'STATUS' }}</span>
      <span>•</span>
      <span>{{ wheelEngine.currentStatus.value.label || 'MARKER' }}</span>
    </footer>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue';
import StatusDisplay from './components/StatusDisplay.vue';
import TelegraphWheel from './components/TelegraphWheel.vue';
import { useTelegraphWheel } from './composables/useTelegraphWheel';
import { useTelegraphSocket } from './composables/useTelegraphSocket';

const wheelEngine = useTelegraphWheel();
const socketEngine = useTelegraphSocket(wheelEngine);

const editCode = ref(socketEngine.currentRoomCode.value);
const isEditing = ref(false);
const codeinputRef = ref(null);

// Sokette oda kodu değişirse inputu otomatik senkronize et
watch(socketEngine.currentRoomCode, (newCode) => {
  editCode.value = newCode;
});

wheelEngine.setSocketCallbacks(
  (angle, isDragging) => socketEngine.sendAngle(angle, isDragging),
  () => socketEngine.sendBell(wheelEngine.currentStatus.value.label)
);

const onFocus = () => {
  isEditing.value = true;
};

// Yazmayı bırakıp dışarı tıklarsa eski odaya geri doldur
const onBlur = () => {
  isEditing.value = false;
  editCode.value = socketEngine.currentRoomCode.value;
};

// Enter ile odaya geç
const submitRoomChange = () => {
  const target = editCode.value.trim().toUpperCase();
  if (target && target !== socketEngine.currentRoomCode.value) {
    socketEngine.joinRoom(target);
  }
  isEditing.value = false;
  codeinputRef.value?.blur();
};

// Esc tuşuna basarsa iptal et
const revertRoomChange = () => {
  editCode.value = socketEngine.currentRoomCode.value;
  isEditing.value = false;
  codeinputRef.value?.blur();
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: fixed; /* Mobilde rubber-band / pull-to-refresh kaymasını kilitler */
  background-color: #edeef0;
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.app-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  gap: 1.2rem;
  touch-action: none; /* Sayfa kaydırmayı engelle */
}

/* MINIMAL ROOM BAR */
.room-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #ffffff;
  padding: 0.35rem 0.6rem 0.35rem 0.8rem;
  border-radius: 30px;
  border: 1px solid #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.peer-badge {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
  padding-right: 0.5rem;
  border-right: 1px solid #e5e7eb;
}
.led {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #9ca3af;
  transition: all 0.3s ease;
}
.peer-badge.online .led {
  background-color: #10b981;
  box-shadow: 0 0 6px #10b981;
}
.peer-badge.online .peer-text {
  color: #111827;
}

/* INLINE CODE INPUT */
.code-editor-wrap {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.inline-code-input {
  border: none;
  background: #f3f4f6;
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 800;
  color: #1f2937;
  padding: 0.25rem 0.55rem;
  border-radius: 8px;
  width: 110px;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  transition: all 0.2s;
}
.inline-code-input:focus {
  background: #ffffff;
  box-shadow: 0 0 0 2px #111827;
}
.confirm-btn {
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
}

/* MINIMAL ICON BUTTON */
.icon-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.icon-btn:hover {
  background: #f3f4f6;
  color: #111827;
}
.refresh-icon {
  font-size: 1.1rem;
  font-weight: bold;
  line-height: 1;
}

/* BELL & TELEMETRY */
.controls {
  display: flex;
  justify-content: center;
}
.bell-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #1a1a1a;
  color: #f8f9fa;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.15s ease;
}
.bell-btn:hover {
  background: #2a2a2a;
}
.bell-btn:active, .bell-btn.ringing {
  transform: scale(0.94);
  background: #dc2626;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
}
.bell-icon {
  font-size: 1.2rem;
}
.telemetry {
  display: flex;
  gap: 0.5rem;
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
}
</style>