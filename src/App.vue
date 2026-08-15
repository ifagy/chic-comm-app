<!-- src/App.vue -->
<template>
  <main class="app-layout">
    
    <!-- MINIMAL & STRICT SESSION BAR -->
    <header class="room-bar">
      <div class="peer-badge">
        <span class="status-indicator" :class="{ 'online': socketEngine.peerCount.value > 1 }"></span>
        <span class="peer-text">
          {{ socketEngine.tempMessage.value || `${socketEngine.peerCount.value} ${socketEngine.peerCount.value === 1 ? 'IN ROOM' : 'IN ROOM'}` }}
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
          class="action-btn confirm-btn" 
          @mousedown.prevent="submitRoomChange"
          title="Join this room"
        >
          <!-- SVG Check -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>
      </div>
    
      <div class="bar-actions">
        <!-- SHARE LINK BUTTON -->
        <button 
          class="action-btn" 
          @click="socketEngine.copyShareLink" 
          title="Copy invitation link"
        >
          <!-- SVG Link -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        </button>
      
        <!-- REFRESH / NEW ROOM BUTTON -->
        <button 
          class="action-btn" 
          @click="socketEngine.leaveAndCreateNewRoom" 
          title="Leave and generate new room"
        >
          <!-- SVG Refresh -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
        </button>
      </div>
    </header>

    <div class="main-stage">
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
          <!-- SVG Bell -->
          <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span class="bell-text">RING BELL</span>
        </button>
      </div>
    </div>

    <footer class="telemetry">
      <div class="telemetry-item">
        <span class="value">{{ wheelEngine.currentStatus.value.group || 'STATUS' }}</span>
      </div>
      <div class="telemetry-divider"></div>
      <div class="telemetry-item">
        <span class="value">{{ wheelEngine.currentStatus.value.label || 'MARKER' }}</span>
      </div>
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

const onBlur = () => {
  isEditing.value = false;
  editCode.value = socketEngine.currentRoomCode.value;
};

const submitRoomChange = () => {
  const target = editCode.value.trim().toUpperCase();

  if (target.length !== 8) {
    editCode.value = socketEngine.currentRoomCode.value;
    isEditing.value = false;
    codeinputRef.value?.blur();
    return;
  }

  if (target && target !== socketEngine.currentRoomCode.value) {
    socketEngine.joinRoom(target);
  }
  isEditing.value = false;
  codeinputRef.value?.blur();
};

const revertRoomChange = () => {
  editCode.value = socketEngine.currentRoomCode.value;
  isEditing.value = false;
  codeinputRef.value?.blur();
};
</script>

<style>
/* Font Imports */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@400;600;700&display=swap');

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
  position: fixed;
  background-color: #F9F9FB; /* Bone White - Anti-Slop Core */
  color: #171717; /* Industrial Charcoal */
  font-family: 'Space Grotesk', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app-layout {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100vh;
  width: 100vw;
  padding: 1rem; 
  touch-action: none;
}

/* MINIMAL & STRICT SESSION BAR */
.room-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 440px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px; /* Disciplined Radius */
  padding: 0.5rem;
  height: 48px;
}

.peer-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  border-right: 1px solid #E5E5E5;
  height: 100%;
}

.status-indicator {
  width: 8px;
  height: 8px;
  background-color: #A3A3A3;
}

.status-indicator.online {
  background-color: #171717; /* Solid Dark instead of glowing green */
}

.peer-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #525252;
  letter-spacing: 0.05em;
}

.code-editor-wrap {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  padding: 0 0.5rem;
}

.inline-code-input {
  width: 100%;
  border: none;
  background: transparent;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #171717;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  padding: 0.25rem;
}

.inline-code-input:focus {
  background: #F4F4F5;
  border-radius: 4px;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-left: 1px solid #E5E5E5;
  padding-left: 0.5rem;
  height: 100%;
}

.action-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #525252;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms linear;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn:hover, .action-btn:focus-visible {
  background: #F4F4F5;
  color: #171717;
  border-color: #E5E5E5;
}

.confirm-btn {
  position: absolute;
  right: 0.5rem;
  background: #171717;
  color: #FFFFFF;
  width: 24px;
  height: 24px;
  border-radius: 4px;
}
.confirm-btn:hover {
  background: #DC2626; /* Accent Red on hover */
  color: #FFFFFF;
}

/* MAIN STAGE (Wheel + Status + Bell) */
.main-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  flex: 1;
  justify-content: center;
  width: 100%;
  max-width: 100%;
}

/* BELL BUTTON */
.controls {
  display: flex;
  justify-content: center;
}

.bell-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #171717;
  color: #FFFFFF;
  border: 1px solid #171717;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 150ms linear;
}

.bell-btn:hover {
  background: #262626;
}

.bell-btn:active, .bell-btn.ringing {
  background: #DC2626;
  border-color: #DC2626;
  color: #FFFFFF;
  transform: translateY(1px); /* Linear physical press */
}

.bell-icon {
  width: 18px;
  height: 18px;
}

/* TELEMETRY FOOTER */
.telemetry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  max-width: 440px;
  padding-top: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem; 
}

.telemetry-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.telemetry .value {
  color: #171717;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em; /* Daha mekanik bir duruş için harf arası açıldı */
}

.telemetry-divider {
  width: 1px;
  height: 12px;

}
</style>