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
  background: #1c222c;
  padding: 1rem 2.5rem;
  border-radius: 30px;
  border: 1px solid #2e3846;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.subtitle {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #8da2b5;
}
.status-label {
  font-size: 1.4rem;
  font-weight: 700;
  color: #d4af37;
  margin-top: 4px;
}
</style>