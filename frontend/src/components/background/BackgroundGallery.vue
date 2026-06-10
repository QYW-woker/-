<template>
  <div class="gallery-wrap">
    <div class="gallery-scroll">
      <div v-if="loading" class="load-item">
        <div class="spinner"></div>
      </div>
      <div v-else-if="bgs.length === 0" class="empty-hint">
        {{ t('bgLib.empty') }}
      </div>
      <BackgroundItem
        v-for="bg in bgs"
        :key="bg.id"
        :bg="{ ...bg, name: bg.name || t('background.myBg') }"
        :isSelected="selectedId === bg.id"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BackgroundItem from './BackgroundItem.vue'
import { listBgs } from '@/services/bgService'

const { t } = useI18n()

defineProps({ selectedId: { type: String, default: null } })
const emit = defineEmits(['select', 'error'])

const bgs = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    bgs.value = await listBgs()
  } catch (err) {
    emit('error', err.message || t('error.bgUploadFailed'))
    bgs.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.gallery-wrap {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.gallery-wrap::-webkit-scrollbar { display: none; }
.gallery-scroll {
  display: flex;
  gap: 12px;
  padding: 8px 16px 12px;
  width: max-content;
  min-width: 100%;
  align-items: center;
}
.load-item {
  display: flex; align-items: center; justify-content: center;
  width: 88px; height: 88px;
}
.empty-hint {
  font-size: 13px;
  color: rgba(255,255,255,0.35);
  padding: 20px 8px;
  white-space: nowrap;
}
.spinner {
  width: 24px; height: 24px;
  border: 2.5px solid rgba(255,255,255,0.2);
  border-top-color: rgba(255,255,255,0.7);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
