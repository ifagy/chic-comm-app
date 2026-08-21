<!-- src/components/StatusDisplay.vue -->
<template>
  <div class="status-card">
    <div class="subtitle">TELEGRAPH ORDER</div>
    <div class="status-label">{{ status?.label || '...' }}</div>
  </div>
</template>

<script setup>
defineProps({
  status: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.status-card {
  background: #FFFFFF;
  padding: 0.75rem 2rem;
  border: 1px solid #E5E5E5;
  border-radius: 6px; /* Disciplined */
  text-align: center;
  min-width: 200px;
}

.subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #737373;
}

.status-label {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #171717;
  margin-top: 2px;
  line-height: 1.2;
}
</style>