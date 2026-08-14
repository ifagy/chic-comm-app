<template>
  <div class="wheel-wrapper">
    <canvas
      ref="canvasRef"
      :width="size"
      :height="size"
      @mousedown="handleMouseDown"
      @touchstart.passive="handleTouchStart"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { NOTCHES, TOTAL_NOTCHES, STEP_ANGLE } from '../config/telegraphNotches';

const props = defineProps({
  size: { type: Number, default: 460 },
  currentAngle: { type: Number, required: true },
  wheelEngine: { type: Object, required: true }
});

const canvasRef = ref(null);
let ctx = null;
let animationId = null;

const handleMouseDown = (e) => {
  const rect = canvasRef.value.getBoundingClientRect();
  props.wheelEngine.startDrag(e.clientX, e.clientY, rect);
};

const handleTouchStart = (e) => {
  const rect = canvasRef.value.getBoundingClientRect();
  props.wheelEngine.startDrag(e.touches[0].clientX, e.touches[0].clientY, rect);
};

const handleMouseMove = (e) => {
  const rect = canvasRef.value.getBoundingClientRect();
  props.wheelEngine.onDrag(e.clientX, e.clientY, rect);
};

const handleTouchMove = (e) => {
  const rect = canvasRef.value.getBoundingClientRect();
  props.wheelEngine.onDrag(e.touches[0].clientX, e.touches[0].clientY, rect);
};

const handlePointerUp = () => {
  props.wheelEngine.stopDrag();
};

function getGroupSpans() {
  const groups = [];
  let current = null;
  NOTCHES.forEach((item, index) => {
    if (item.group) {
      if (!current || current.name !== item.group) {
        current = { name: item.group, start: index, end: index };
        groups.push(current);
      } else {
        current.end = index;
      }
    } else {
      current = null;
    }
  });
  return groups;
}

const draw = () => {
  if (!ctx || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = cx - 18;
  const innerRadius = radius * 0.44;
  const hubRadius = radius * 0.22;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(cx, cy);

  // 1. Kadran Zemin ve Dış Çerçeve
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f8f9fa';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#1a1a1a';
  ctx.stroke();

  // 2. İç Yaylar ve Eğik Grup Başlıkları
  const groupSpans = getGroupSpans();
  groupSpans.forEach(g => {
    const startAngle = -Math.PI / 2 - STEP_ANGLE / 2 + g.start * STEP_ANGLE;
    const endAngle = -Math.PI / 2 - STEP_ANGLE / 2 + (g.end + 1) * STEP_ANGLE;

    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, startAngle, endAngle);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1a1a1a';
    ctx.stroke();

    const isLeft = g.start >= 6;
    drawArcText(g.name, innerRadius * 0.75, startAngle, endAngle, isLeft);
  });

  // 3. 12 Dilim Ayırıcı Çizgileri
  for (let i = 0; i < TOTAL_NOTCHES; i++) {
    const lineAngle = -Math.PI / 2 - STEP_ANGLE / 2 + i * STEP_ANGLE;
    const prevItem = NOTCHES[(i - 1 + TOTAL_NOTCHES) % TOTAL_NOTCHES];
    const currItem = NOTCHES[i];
    const hasGroup = (prevItem && prevItem.group) && (currItem && currItem.group);

    ctx.save();
    ctx.rotate(lineAngle);
    ctx.beginPath();
    ctx.moveTo(hasGroup ? innerRadius : hubRadius, 0);
    ctx.lineTo(radius, 0);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1a1a1a';
    ctx.stroke();
    ctx.restore();
  }

  // 4. Metinler ve Tepe Kırmızı Vizör (Doğru Eksen Yerleşimi)
  NOTCHES.forEach((item, i) => {
    const midAngle = -Math.PI / 2 + i * STEP_ANGLE;

    ctx.save();
    ctx.rotate(midAngle);
    ctx.translate(radius * 0.74, 0); // Eksen boyunca dışa taşı (Sorunun çözüldüğü nokta)

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (i === 0) {
      // 12 Yönü Kırmızı İşaret
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-17, -12, 34, 24);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(-17, -12, 34, 24);
    } 
    else if (i === 11 || i === 1) { // YES & NO
      ctx.rotate(Math.PI / 2); 
      ctx.font = '900 19px "Arial Black", sans-serif';
      ctx.fillText(item.label, 0, 0);
    } 
    else if (i === 6) { // COME HERE (İki satır, düz)
      ctx.rotate(-Math.PI / 2);
      ctx.font = '900 15px "Arial Black", sans-serif';
      ctx.fillText("COME", 0, -8);
      ctx.fillText("HERE", 0, 8);
    } 
    else if (i === 5 || i === 7) { // LATER & 5 MINS
      ctx.rotate(-Math.PI / 2);
      ctx.font = '900 16px "Arial Black", sans-serif';
      ctx.fillText(item.label, 0, 0);
    } 
    else {
      // Yan Radyal Metinler (TIME FOR & RICH IS dilimleri)
      if (i >= 8 && i <= 10) {
        ctx.rotate(Math.PI); // Sol tarafın okuması için çevir
      }
      ctx.font = '900 16px "Arial Black", sans-serif';
      ctx.fillText(item.label, 0, 0);
    }

    ctx.restore();
  });


  //5. merkez çember
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#1a1a1a';
  ctx.stroke();
  ctx.restore();

  // 6. Merkez İbre (Hata düzeltildi: Eksen hizalaması tam uyumlu)
  ctx.save();
  ctx.rotate(props.currentAngle -3* STEP_ANGLE + Math.PI / 2); // İbre yukarı(0) baz alınarak döner

  ctx.beginPath();
  let aaa = 25;
  ctx.moveTo(0, -radius + 74 + aaa);
  ctx.lineTo(13, -radius + 102 + aaa);
  ctx.lineTo(5, -radius + 102 + aaa);
  ctx.lineTo(5, -hubRadius * 0.3);
  ctx.lineTo(-5, -hubRadius * 0.3);
  ctx.lineTo(-5, -radius + 102 +aaa);
  ctx.lineTo(-13, -radius + 102 +aaa );
  ctx.closePath();
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-5, hubRadius * 0.1);
  ctx.lineTo(5, hubRadius * 0.1);
  ctx.lineTo(9, radius * 0.35);
  ctx.lineTo(0, radius * 0.25);
  ctx.lineTo(-9, radius * 0.35);
  ctx.closePath();
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();

  const rd = 7.5;
  ctx.fillStyle = '#ffffff';
  [[-rd, -rd], [rd, -rd], [-rd, rd], [rd, rd]].forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
  ctx.restore();
};

function drawArcText(text, r, startAngle, endAngle, isLeft) {
  ctx.save();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = '900 12px "Arial Black", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = isLeft ? text.split('').reverse().join('') : text;
  const totalAngle = endAngle - startAngle;
  const step = totalAngle / (chars.length + 1);

  for (let i = 0; i < chars.length; i++) {
    const angle = startAngle + step * (i + 1);
    ctx.save();
    ctx.rotate(angle);
    ctx.translate(r, 0);
    ctx.rotate(isLeft ? -Math.PI / 2 : Math.PI / 2);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

const loop = () => {
  props.wheelEngine.updatePhysics();
  draw();
  animationId = requestAnimationFrame(loop);
};

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handlePointerUp);
  window.addEventListener('touchmove', handleTouchMove);
  window.addEventListener('touchend', handlePointerUp);
  animationId = requestAnimationFrame(loop);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handlePointerUp);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('touchend', handlePointerUp);
  cancelAnimationFrame(animationId);
});
</script>

<style scoped>
.wheel-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}
canvas {
  touch-action: none;
  cursor: grab;
  border-radius: 50%;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  background-color: #fff;
}
canvas:active {
  cursor: grabbing;
}
</style>