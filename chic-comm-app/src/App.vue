<template>
  <main class="app-layout">
    <StatusDisplay :status="wheelEngine.currentStatus.value" />

    <TelegraphWheel
      :size="460"
      :current-angle="wheelEngine.currentAngle.value"
      :wheel-engine="wheelEngine"
    />

    <!-- Analog Telgraf Zili Butonu -->
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
import StatusDisplay from './components/StatusDisplay.vue';
import TelegraphWheel from './components/TelegraphWheel.vue';
import { useTelegraphWheel } from './composables/useTelegraphWheel';

const wheelEngine = useTelegraphWheel();
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}
body {
  background-color: #edeef0;
  color: #111827;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}
.app-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1.25rem;
}
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
  padding: 0.8rem 2rem;
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
  transform: translateY(-1px);
}
.bell-btn:active, .bell-btn.ringing {
  transform: scale(0.94);
  background: #dc2626; /* Zil basıldığında kırmızı efekt */
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