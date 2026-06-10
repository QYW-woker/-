<template>
  <div class="composite-wrap">
    <img v-if="dataUrl" :src="dataUrl" alt="合成预览" class="composite-img" />
    <div v-else class="composite-placeholder">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="6" y="12" width="36" height="26" rx="4"/>
        <circle cx="18" cy="22" r="4"/>
        <path d="M6 32 l9-8 8 8 7-6 12 10"/>
      </svg>
      <p>{{ t('background.previewHint') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
defineProps({
  dataUrl: { type: String, default: null }
})
</script>

<style scoped>
.composite-wrap {
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.composite-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.composite-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.3);
}
.composite-placeholder svg {
  width: 48px;
  height: 48px;
}
.composite-placeholder p {
  font-size: 13px;
}
</style>
