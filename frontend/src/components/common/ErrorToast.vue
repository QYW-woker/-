<template>
  <Transition name="slide-up">
    <div v-if="message" class="error-toast">
      <span class="icon">!</span>
      <span>{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' }
})
</script>

<style scoped>
.error-toast {
  position: fixed;
  bottom: calc(24px + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: #c62828;
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  max-width: 320px;
  width: 90%;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 13px;
  flex-shrink: 0;
}
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
