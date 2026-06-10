<template>
  <div
    class="bg-item"
    :class="{ selected: isSelected }"
    @click="emit('select', bg)"
  >
    <img
      :src="bg.thumbnail"
      :alt="bg.name"
      loading="lazy"
      @error="onImgError"
    />
    <div v-if="imgError" class="color-fallback" :style="{ background: bg.color }"></div>
    <div class="bg-name">{{ bg.name }}</div>
    <button v-if="deletable" class="delete-btn" @click.stop="emit('delete', bg)">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="2" y1="2" x2="10" y2="10"/>
        <line x1="10" y1="2" x2="2" y2="10"/>
      </svg>
    </button>
    <div v-if="isSelected" class="check-badge">
      <svg viewBox="0 0 16 16" fill="none">
        <polyline points="3,8 7,12 13,5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  bg: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  deletable: { type: Boolean, default: false }
})
const emit = defineEmits(['select', 'delete'])
const imgError = ref(false)
function onImgError() { imgError.value = true }
</script>

<style scoped>
.bg-item {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  border: 2.5px solid transparent;
  transition: border-color 0.2s, transform 0.15s;
}
.bg-item:active {
  transform: scale(0.95);
}
.bg-item.selected {
  border-color: #6c63ff;
}
.bg-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.color-fallback {
  position: absolute;
  inset: 0;
}
.bg-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 0 5px;
  background: linear-gradient(transparent, rgba(0,0,0,0.65));
  color: white;
  font-size: 11px;
  text-align: center;
}
.delete-btn {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.delete-btn svg {
  width: 10px;
  height: 10px;
}
.check-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #6c63ff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.check-badge svg {
  width: 14px;
  height: 14px;
}
</style>
