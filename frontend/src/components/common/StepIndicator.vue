<template>
  <div class="step-indicator">
    <div
      v-for="n in total"
      :key="n"
      class="step-dot"
      :class="{ active: n === current, done: n < current }"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  current: { type: Number, default: 1 },
  total: { type: Number, default: 3 }
})
</script>

<style scoped>
.step-indicator {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}
.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  transition: all 0.3s ease;
}
.step-dot.done {
  background: rgba(108, 99, 255, 0.6);
}
.step-dot.active {
  width: 24px;
  border-radius: 4px;
  background: #6c63ff;
}
</style>
