// src/composables/useTelegraphWheel.js
import { ref, computed } from 'vue';
import { TOTAL_NOTCHES, STEP_ANGLE, PHYSICS_CONFIG } from '../config/telegraphNotches';
import { useTelegraphAudio } from './useTelegraphAudio';
import { useHaptics } from './useHaptics';

export function useTelegraphWheel(roomNotches) {
  const currentAngle = ref(0);
  const targetAngle = ref(0);
  const isDragging = ref(false);
  const isRemoteDragging = ref(false);
  const isBellRinging = ref(false);

  const { playClickSound, playBellSound, initAudio } = useTelegraphAudio();
  const { triggerNotchHaptic, triggerBellHaptic, triggerJoinHaptic, triggerLeaveHaptic, triggerRoomCreateHaptic  } = useHaptics();

  let onAngleChangedCallback = null;
  let onBellCallback = null;

  let velocity = 0;
  let dragStartPointerAngle = 0;
  let dragStartWheelAngle = 0;
  let lastPlayedNotchIndex = 0;

  const activeNotchIndex = computed(() => {
    let idx = Math.round(currentAngle.value / STEP_ANGLE) % TOTAL_NOTCHES;
    return idx < 0 ? idx + TOTAL_NOTCHES : idx;
  });

  const currentStatus = computed(() => {
    return roomNotches.value[activeNotchIndex.value] || {};
  });

  const displayDegree = computed(() => {
    let deg = (currentAngle.value * (180 / Math.PI)) % 360;
    return deg < 0 ? deg + 360 : deg;
  });

  // Çentik geçişinde hem ses hem titreşim
  const checkAndPlayNotchFeedback = () => {
    const currentNotch = activeNotchIndex.value;
    if (currentNotch !== lastPlayedNotchIndex) {
      playClickSound();
      triggerNotchHaptic();
      lastPlayedNotchIndex = currentNotch;
    }
  };

  const getPointerAngle = (clientX, clientY, canvasRect) => {
    const cx = canvasRect.width / 2;
    const cy = canvasRect.height / 2;
    const x = clientX - canvasRect.left - cx;
    const y = clientY - canvasRect.top - cy;
    return Math.atan2(y, x);
  };

  const startDrag = (clientX, clientY, canvasRect) => {
    initAudio();
    isDragging.value = true;
    velocity = 0;
    dragStartPointerAngle = getPointerAngle(clientX, clientY, canvasRect);
    dragStartWheelAngle = currentAngle.value;

    if (onAngleChangedCallback) {
      onAngleChangedCallback(currentAngle.value, true);
    }
  };

  const onDrag = (clientX, clientY, canvasRect) => {
    if (!isDragging.value) return;

    const pointerAngle = getPointerAngle(clientX, clientY, canvasRect);
    let deltaAngle = pointerAngle - dragStartPointerAngle;

    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    currentAngle.value = dragStartWheelAngle + deltaAngle;
    targetAngle.value = currentAngle.value;

    checkAndPlayNotchFeedback();

    if (onAngleChangedCallback) {
      onAngleChangedCallback(currentAngle.value, true);
    }
  };

  const stopDrag = () => {
    if (!isDragging.value) return;
    isDragging.value = false;

    const notchIndex = Math.round(currentAngle.value / STEP_ANGLE);
    targetAngle.value = notchIndex * STEP_ANGLE;

    if (onAngleChangedCallback) {
      onAngleChangedCallback(targetAngle.value, false);
    }
  };

  const updatePhysics = () => {
    if (!isDragging.value && !isRemoteDragging.value) {
      const displacement = targetAngle.value - currentAngle.value;
      const springForce = displacement * PHYSICS_CONFIG.SPRING_STIFFNESS;

      velocity += springForce;
      velocity *= PHYSICS_CONFIG.DAMPING;
      currentAngle.value += velocity;

      if (Math.abs(velocity) > 0.005) {
        checkAndPlayNotchFeedback();
      }
    }
  };

  // Local Bell Trigger
  const ringBell = () => {
    initAudio();
    isBellRinging.value = true;
    playBellSound();
    triggerBellHaptic();
    console.log(`🔔 [LOCAL BELL]: "${currentStatus.value.label || 'MARKER'}" | Notch: #${activeNotchIndex.value}`);
    
    try {
      if (onBellCallback) onBellCallback();
    } catch (err) {
      console.error('onBellCallback error:', err);
    } finally {
      setTimeout(() => {
        isBellRinging.value = false;
      }, 300);
    }
  };

  const applyRemoteAngle = (angle, remoteIsDragging) => {
    isRemoteDragging.value = remoteIsDragging;

    if (remoteIsDragging) {
      velocity = 0;
      currentAngle.value = angle;
      targetAngle.value = angle;
      checkAndPlayNotchFeedback();
    } else {
      targetAngle.value = angle;
    }
  };

  // Remote Bell Trigger
  const triggerRemoteBell = () => {
    initAudio();
    isBellRinging.value = true;
    playBellSound();
    triggerBellHaptic();
    console.log(`🔔✨ [REMOTE BELL RECEIVED]: Partner rang the attention bell!`);
    setTimeout(() => { isBellRinging.value = false; }, 400);
  };

  const setSocketCallbacks = (angleCb, bellCb) => {
    onAngleChangedCallback = angleCb;
    onBellCallback = bellCb;
  };

  return {
    currentAngle,
    targetAngle,
    isDragging,
    isRemoteDragging,
    isBellRinging,
    activeNotchIndex,
    currentStatus,
    displayDegree,
    startDrag,
    onDrag,
    stopDrag,
    updatePhysics,
    ringBell,
    applyRemoteAngle,
    triggerRemoteBell,
    setSocketCallbacks,
    triggerJoinHaptic,
    triggerLeaveHaptic,
    triggerRoomCreateHaptic
  };
}