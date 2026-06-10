<template>
  <div class="ss-settings-page">
    <header class="ss-header">
      <button class="back-btn" @click="router.push('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h1 class="header-title">{{ t('screensaver.title') }}</h1>
      <div class="header-right">
        <span v-if="ssStore.selected.length > 0" class="sel-count">
          {{ t('screensaver.selected', { n: ssStore.selected.length }) }}
        </span>
        <button
          v-if="ssStore.selected.length > 0"
          class="clear-btn"
          @click="ssStore.clearAll()"
        >✕</button>
      </div>
    </header>

    <!-- Hint -->
    <p class="select-hint">{{ t('screensaver.selectHint') }}</p>

    <!-- Loading -->
    <div v-if="loading" class="state-wrap">
      <div class="spinner"></div>
    </div>

    <!-- Empty album -->
    <div v-else-if="photos.length === 0" class="state-wrap">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="6" y="10" width="52" height="40" rx="4"/>
        <circle cx="22" cy="27" r="7"/>
        <path d="M6 46 l16-14 12 12 10-8 14 10"/>
      </svg>
      <p class="state-title">{{ t('screensaver.empty') }}</p>
      <p class="state-hint">{{ t('screensaver.emptyHint') }}</p>
    </div>

    <!-- Photo grid -->
    <div v-else class="photo-grid">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="photo-card"
        :class="{ selected: ssStore.isSelected(photo.id) }"
        @click="ssStore.togglePhoto(photo)"
      >
        <img :src="photo.thumbnail" :alt="photo.id" loading="lazy" />
        <!-- Check overlay -->
        <Transition name="check-pop">
          <div v-if="ssStore.isSelected(photo.id)" class="check-overlay">
            <div class="check-badge">
              <svg viewBox="0 0 20 20" fill="none">
                <polyline points="4,10 9,15 16,6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Confirm fab (if something selected) -->
    <Transition name="fab-slide">
      <button
        v-if="ssStore.selected.length > 0"
        class="confirm-fab"
        @click="router.push('/')"
      >
        {{ t('screensaver.done') }}
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useScreensaverStore } from '@/stores/screensaverStore'
import axios from 'axios'

const { t } = useI18n()
const router = useRouter()
const ssStore = useScreensaverStore()

const photos = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await axios.get('/api/photos')
    photos.value = res.data.photos || []
  } catch {
    photos.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ss-settings-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: #0a0a1a;
  overflow: hidden;
  color: white;
}

/* Header */
.ss-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(16px + var(--safe-top, 0px)) 16px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.back-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.back-btn svg { width: 20px; height: 20px; }
.header-title {
  flex: 1;
  font-size: 18px; font-weight: 700; margin: 0;
}
.header-right {
  display: flex; align-items: center; gap: 8px;
}
.sel-count {
  font-size: 13px;
  color: #6c63ff;
  font-weight: 600;
}
.clear-btn {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  font-size: 13px; color: rgba(255,255,255,0.6);
  display: flex; align-items: center; justify-content: center;
}

/* Hint */
.select-hint {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  padding: 8px 16px 0;
  margin: 0;
  flex-shrink: 0;
}

/* State */
.state-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}
.state-wrap svg { width: 64px; height: 64px; color: rgba(255,255,255,0.2); }
.state-title { font-size: 16px; color: rgba(255,255,255,0.6); margin: 0; }
.state-hint { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; text-align: center; }
.spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Photo grid */
.photo-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(100px, 28vw, 180px), 1fr));
  gap: 3px;
  overflow-y: auto;
  padding: 8px;
  -webkit-overflow-scrolling: touch;
}
.photo-card {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2.5px solid transparent;
  transition: border-color 0.2s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.photo-card:active { transform: scale(0.96); }
.photo-card.selected { border-color: #6c63ff; }
.photo-card img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}

/* Check overlay */
.check-overlay {
  position: absolute; inset: 0;
  background: rgba(108,99,255,0.25);
  display: flex; align-items: flex-start; justify-content: flex-end;
  padding: 6px;
}
.check-badge {
  width: 24px; height: 24px; border-radius: 50%;
  background: #6c63ff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(108,99,255,0.6);
}
.check-badge svg { width: 14px; height: 14px; }

.check-pop-enter-active { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s; }
.check-pop-leave-active { transition: transform 0.15s, opacity 0.15s; }
.check-pop-enter-from { transform: scale(0.5); opacity: 0; }
.check-pop-leave-to  { transform: scale(0.5); opacity: 0; }

/* Confirm FAB */
.confirm-fab {
  position: absolute;
  bottom: calc(24px + var(--safe-bottom, 0px));
  left: 50%; transform: translateX(-50%);
  background: #6c63ff;
  color: white;
  font-size: 15px; font-weight: 700;
  padding: 14px 40px;
  border-radius: 32px;
  box-shadow: 0 8px 32px rgba(108,99,255,0.5);
  white-space: nowrap;
  z-index: 10;
}
.fab-slide-enter-active { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s; }
.fab-slide-leave-active { transition: transform 0.2s, opacity 0.2s; }
.fab-slide-enter-from { transform: translateX(-50%) translateY(80px); opacity: 0; }
.fab-slide-leave-to  { transform: translateX(-50%) translateY(80px); opacity: 0; }

/* ── Wide screen (32:9 kiosk) ────────────── */
@media (min-aspect-ratio: 2/1) {
  .ss-header { padding: 20px 32px; }
  .header-title { font-size: 24px; }
  .back-btn { width: 52px; height: 52px; }
  .back-btn svg { width: 22px; height: 22px; }
  .sel-count { font-size: 15px; }
  .clear-btn { width: 36px; height: 36px; font-size: 15px; }

  .select-hint { font-size: 14px; padding: 8px 32px 0; }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    padding: 16px 24px;
  }
  /* Always show check badge on touch kiosk */
  .check-badge { width: 30px; height: 30px; }
  .check-badge svg { width: 16px; height: 16px; }

  .confirm-fab {
    font-size: 17px;
    padding: 18px 56px;
    border-radius: 40px;
    bottom: 28px;
  }
}
</style>
