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
          v-if="isEditing && editCode.trim().length === 8 && editCode.trim() !== socketEngine.currentRoomCode.value" 
          class="action-btn confirm-btn" 
          @mousedown.prevent="submitRoomChange"
          title="Join this room"
        >
          <!-- SVG Check -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </button>
      </div>
    
      <!-- TEK VE DÜZENLİ BAR AKSİYONLARI -->
      <div class="bar-actions">
        <!-- EDIT NOTCHES BUTTON -->
        <button class="action-btn" @click="openSheet" title="Edit Markers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>

        <!-- SHARE LINK BUTTON -->
        <button class="action-btn" @click="socketEngine.copyShareLink" title="Copy invitation link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        </button>
      
        <!-- REFRESH / NEW ROOM BUTTON -->
        <button class="action-btn" @click="socketEngine.leaveAndCreateNewRoom" title="Leave and generate new room">
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
        :notches="roomNotches"
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

    <!-- BOTTOM SHEET & OVERLAY -->
    <div class="sheet-overlay" :class="{'is-open': isSheetOpen}" @click="closeSheet"></div>
    <div class="bottom-sheet" :class="{'is-open': isSheetOpen}">
      <div class="sheet-header">
        <h3>Room Markers</h3>
        <button class="action-btn" @click="closeSheet">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="sheet-content">
         <div class="notch-row" v-for="notch in localNotches.slice(1)" :key="notch.id">
            <span class="notch-id">#{{ notch.id }}</span>
            <input type="text" v-model="notch.group" placeholder="GROUP (Opt)" class="notch-input" maxlength="10"/>
            <input type="text" v-model="notch.label" placeholder="LABEL" class="notch-input" maxlength="10"/>
         </div>
      </div>
      <div class="sheet-footer">
         <button class="save-btn" @click="saveNotches">SAVE TO ROOM</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue';
import StatusDisplay from './components/StatusDisplay.vue';
import TelegraphWheel from './components/TelegraphWheel.vue';
import { useTelegraphWheel } from './composables/useTelegraphWheel';
import { useTelegraphSocket } from './composables/useTelegraphSocket';
import { NOTCHES as DEFAULT_NOTCHES } from './config/telegraphNotches';

const roomNotches = ref(JSON.parse(JSON.stringify(DEFAULT_NOTCHES)));

const wheelEngine = useTelegraphWheel(roomNotches);
const socketEngine = useTelegraphSocket(wheelEngine, roomNotches);

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

const isSheetOpen = ref(false);
const localNotches = ref([]);

const openSheet = () => {
  localNotches.value = JSON.parse(JSON.stringify(roomNotches.value));
  isSheetOpen.value = true;
};

const closeSheet = () => {
  isSheetOpen.value = false;
};

const saveNotches = () => {
  roomNotches.value = JSON.parse(JSON.stringify(localNotches.value));
  socketEngine.sendNotches(roomNotches.value);
  closeSheet();
};
</script>

<style>
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
  background-color: #F9F9FB;
  color: #171717;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app-layout {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  height: 100vh;
  height: 100dvh; /* Mobil tarayıcı barı uyumlu */
  width: 100vw;
  padding: 0.75rem 1rem; 
  touch-action: none;
}

/* SESSION BAR */
.room-bar {
background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 440px;
    height: 48px;
    padding: .5rem;
    display: flex;
}

.peer-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-right: 0.5rem;
  border-right: 1px solid #E5E5E5;
  height: 100%;
}

.status-indicator {
  width: 7px;
  height: 7px;
  background-color: #A3A3A3;
}

.status-indicator.online {
  background-color: #171717;
}

.peer-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: #525252;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.code-editor-wrap {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  padding: 0 0.25rem;
}

.inline-code-input {
  width: 100%;
  border: none;
  background: transparent;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #171717;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  padding: 0.2rem;
}

.inline-code-input:focus {
  background: #F4F4F5;
  border-radius: 4px;
}

.bar-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  border-left: 1px solid #E5E5E5;
  padding-left: 0.35rem;
  height: 100%;
}

.action-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #525252;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms linear;
}

.action-btn svg {
  width: 15px;
  height: 15px;
}

.action-btn:hover, .action-btn:focus-visible {
  background: #F4F4F5;
  color: #171717;
  border-color: #E5E5E5;
}

.confirm-btn {
  position: absolute;
  right: 0.25rem;
  background: #171717;
  color: #FFFFFF;
  width: 22px;
  height: 22px;
  border-radius: 4px;
}
.confirm-btn:hover {
  background: #DC2626;
  color: #FFFFFF;
}

/* MAIN STAGE */
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
  padding: 0.65rem 1.75rem;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.85rem;
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
  transform: translateY(1px);
}

.bell-icon {
  width: 17px;
  height: 17px;
}

/* TELEMETRY FOOTER */
.telemetry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  max-width: 440px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem; 
}

.telemetry-item {
  display: flex;
  align-items: center;
}

.telemetry .value {
  color: #171717;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.telemetry-divider {
  width: 1px;
  height: 12px;
  background-color: #E5E5E5;
}

/* BOTTOM SHEET */
.sheet-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(23, 23, 23, 0.4); backdrop-filter: blur(2px);
  opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 99;
}
.sheet-overlay.is-open { opacity: 1; pointer-events: auto; }

.bottom-sheet {
  position: fixed; left: 0; bottom: 0; width: 100vw; max-height: 80vh;
  background: #FFFFFF; border-radius: 16px 16px 0 0;
  transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100; display: flex; flex-direction: column;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.1);
}
.bottom-sheet.is-open { transform: translateY(0); }

.sheet-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.85rem 1.25rem; border-bottom: 1px solid #E5E5E5;
}
.sheet-header h3 { font-size: 0.95rem; font-weight: 700; color: #171717; }

.sheet-content {
  padding: 1rem 1.25rem; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 0.6rem;
}
.notch-row { display: flex; gap: 0.5rem; align-items: center; }
.notch-id { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 700; color: #A3A3A3; width: 24px;}
.notch-input {
  flex: 1; border: 1px solid #E5E5E5; border-radius: 4px; padding: 0.45rem 0.6rem;
  font-family: 'Space Grotesk', sans-serif; font-size: 0.82rem; font-weight: 600; text-transform: uppercase;
}
.notch-input:focus { outline: none; border-color: #171717; background: #F4F4F5; }

.sheet-footer { padding: 0.85rem 1.25rem; border-top: 1px solid #E5E5E5; }
.save-btn {
  width: 100%; background: #171717; color: #FFF; padding: 0.7rem;
  border: none; border-radius: 6px; font-family: 'Space Grotesk', sans-serif;
  font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.15s; letter-spacing: 0.05em;
}
.save-btn:active { background: #DC2626; }
</style>