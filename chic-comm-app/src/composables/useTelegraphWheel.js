import { ref, computed } from 'vue';
import { NOTCHES, TOTAL_NOTCHES, STEP_ANGLE, PHYSICS_CONFIG } from '../config/telegraphNotches';

export function useTelegraphWheel() {
  const currentAngle = ref(0);
  const targetAngle = ref(0);
  const isDragging = ref(false);
  const isBellRinging = ref(false); // Zil basılma animasyon state'i

  let velocity = 0;
  let dragStartPointerAngle = 0;
  let dragStartWheelAngle = 0;

  const activeNotchIndex = computed(() => {
    let idx = Math.round(currentAngle.value / STEP_ANGLE) % TOTAL_NOTCHES;
    return idx < 0 ? idx + TOTAL_NOTCHES : idx;
  });

  const currentStatus = computed(() => NOTCHES[activeNotchIndex.value]);

  const displayDegree = computed(() => {
    let deg = (currentAngle.value * (180 / Math.PI)) % 360;
    return deg < 0 ? deg + 360 : deg;
  });

  const getPointerAngle = (clientX, clientY, canvasRect) => {
    const cx = canvasRect.width / 2;
    const cy = canvasRect.height / 2;
    const x = clientX - canvasRect.left - cx;
    const y = clientY - canvasRect.top - cy;
    return Math.atan2(y, x);
  };

  const startDrag = (clientX, clientY, canvasRect) => {
    isDragging.value = true;
    velocity = 0;
    dragStartPointerAngle = getPointerAngle(clientX, clientY, canvasRect);
    dragStartWheelAngle = currentAngle.value;
  };

  const onDrag = (clientX, clientY, canvasRect) => {
    if (!isDragging.value) return;

    const pointerAngle = getPointerAngle(clientX, clientY, canvasRect);
    let deltaAngle = pointerAngle - dragStartPointerAngle;

    while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    currentAngle.value = dragStartWheelAngle + deltaAngle;
  };

  const stopDrag = () => {
    if (!isDragging.value) return;
    isDragging.value = false;

    const notchIndex = Math.round(currentAngle.value / STEP_ANGLE);
    targetAngle.value = notchIndex * STEP_ANGLE;
  };

  const updatePhysics = () => {
    if (!isDragging.value) {
      const displacement = targetAngle.value - currentAngle.value;
      const springForce = displacement * PHYSICS_CONFIG.SPRING_STIFFNESS;

      velocity += springForce;
      velocity *= PHYSICS_CONFIG.DAMPING;
      currentAngle.value += velocity;
    }
  };

  // --- ZİL (BELL / DING) TETİKLEYİCİ ---
  const ringBell = () => {
    isBellRinging.value = true;
    const currentOrder = currentStatus.value.label || 'RED_INDICATOR';
    
    // Konsol logu
    console.log(`🔔 [TELEGRAPH BELL RING]: Dikkat çağrısı yapıldı! Seçili Durum: "${currentOrder}" | Çentik: #${activeNotchIndex.value}`);

    // Kısa basma efekti sonrası state'i sıfırla
    setTimeout(() => {
      isBellRinging.value = false;
    }, 250);
  };

  return {
    currentAngle,
    targetAngle,
    isDragging,
    isBellRinging,
    activeNotchIndex,
    currentStatus,
    displayDegree,
    startDrag,
    onDrag,
    stopDrag,
    updatePhysics,
    ringBell
  };
}