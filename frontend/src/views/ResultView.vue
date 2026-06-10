<template>
  <div class="result-page" @click="resetTimer" @touchstart.passive="resetTimer">

    <!-- Left panel: composite photo -->
    <div class="result-left">
      <div class="photo-frame">
        <img :src="store.compositeDataUrl" :alt="t('result.success')" class="result-img" />
        <div class="success-badge">
          <svg viewBox="0 0 20 20" fill="white">
            <circle cx="10" cy="10" r="10" fill="#4caf50"/>
            <polyline points="5,10 9,14 15,7" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{{ t('result.success') }}</span>
        </div>
      </div>
    </div>

    <!-- Right panel: header + QR + actions -->
    <div class="result-right">
      <header class="result-header">
        <div style="width:44px"></div>
        <StepIndicator :current="3" :total="3" />
        <LanguageSwitcher />
      </header>

      <div class="qr-wrap">
        <QRCodeDisplay :url="store.downloadUrl" :qrSize="qrSize" />
      </div>

      <div class="auto-reset-bar">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="8" cy="8" r="6.5"/>
          <path d="M8 5v3.5L10.5 11"/>
        </svg>
        <span>{{ t('result.autoReset', { n: resetSeconds }) }}</span>
        <span class="touch-hint">· {{ t('result.touchToKeep') }}</span>
      </div>

      <footer class="result-footer">
        <button class="btn btn-outline" @click.stop="handleRetake">{{ t('result.retake') }}</button>
        <button class="btn btn-primary" @click.stop="handleChangeBackground">{{ t('result.changeBg') }}</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePhotoStore } from '@/stores/photoStore'
import QRCodeDisplay from '@/components/result/QRCodeDisplay.vue'
import StepIndicator from '@/components/common/StepIndicator.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const store = usePhotoStore()

const RESET_TOTAL = 120
const resetSeconds = ref(RESET_TOTAL)
let autoResetInterval = null

function startAutoReset() {
  clearInterval(autoResetInterval)
  resetSeconds.value = RESET_TOTAL
  autoResetInterval = setInterval(() => {
    resetSeconds.value--
    if (resetSeconds.value <= 0) {
      clearInterval(autoResetInterval)
      store.resetAll()
      router.push('/')
    }
  }, 1000)
}

function resetTimer() { resetSeconds.value = RESET_TOTAL }

const qrSize = computed(() => {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w / h >= 2) return 300   // wide kiosk — large QR for easy scan
  if (w <= 375) return 160
  if (w <= 414) return 180
  return 200
})

function handleRetake() {
  clearInterval(autoResetInterval)
  store.resetAll()
  router.push('/')
}

function handleChangeBackground() {
  clearInterval(autoResetInterval)
  store.compositeDataUrl = null
  store.uploadedImageId = null
  store.downloadUrl = null
  store.selectedBackground = null
  router.push('/background')
}

onMounted(startAutoReset)
onUnmounted(() => clearInterval(autoResetInterval))
</script>

<style scoped>
/* ── Base layout (portrait / mobile) ──────── */
.result-page {
  display: flex; flex-direction: column;
  width: 100vw; height: 100vh; height: 100dvh;
  background: var(--bg-dark, #0a0a1a); overflow: hidden;
}

/* In normal mode the two panels stack vertically */
.result-left {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 12px 24px 0; min-height: 0;
}
.result-right {
  flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center;
}

.result-header {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%;
  padding: calc(12px + var(--safe-top, 0px)) 16px 8px;
  flex-shrink: 0;
}

.photo-frame {
  position: relative; border-radius: 16px; overflow: hidden;
  width: 100%; background: #000;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
.result-img { width: 100%; max-height: 42vh; object-fit: contain; display: block; }

.success-badge {
  position: absolute; top: 12px; right: 12px;
  display: flex; align-items: center; gap: 6px;
  background: rgba(0,0,0,0.6); padding: 6px 12px 6px 8px;
  border-radius: 20px; color: white; font-size: 13px; font-weight: 500;
  backdrop-filter: blur(4px);
}
.success-badge svg { width: 20px; height: 20px; }

.qr-wrap { flex-shrink: 0; padding: 12px 0 4px; }

.auto-reset-bar {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 4px 0;
  color: rgba(255,255,255,0.4); font-size: 12px;
}
.auto-reset-bar svg { width: 14px; height: 14px; flex-shrink: 0; }
.touch-hint { color: rgba(255,255,255,0.25); }

.result-footer {
  flex-shrink: 0;
  display: flex; gap: 12px;
  width: 100%;
  padding: 8px 24px calc(20px + var(--safe-bottom, 0px));
}
.btn {
  flex: 1; height: 52px; border-radius: 26px;
  font-size: 15px; font-weight: 600; transition: all 0.2s;
}
.btn-primary { background: #6c63ff; color: white; }
.btn-primary:active { background: #4a42d4; }
.btn-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.25); }
.btn-outline:active { background: rgba(255,255,255,0.08); }

/* ── Wide screen (32:9 kiosk) ────────────── */
@media (min-aspect-ratio: 2/1) {
  .result-page { flex-direction: row; }

  /* Left: big composite image */
  .result-left {
    width: 55%; flex: none; height: 100%;
    padding: 32px 24px 32px 40px;
    align-items: center;
  }
  .photo-frame { width: 100%; max-height: 100%; }
  .result-img { max-height: 85vh; }

  /* Right: header + QR + actions stacked */
  .result-right {
    flex: 1; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 24px 48px;
    gap: 16px;
    border-left: 1px solid rgba(255,255,255,0.07);
  }
  .result-header { padding: 0; justify-content: space-between; }
  .qr-wrap { padding: 0; }

  .auto-reset-bar { font-size: 14px; }
  .auto-reset-bar svg { width: 16px; height: 16px; }

  .result-footer {
    padding: 0; gap: 16px; width: 100%;
  }
  .btn { height: 64px; font-size: 18px; border-radius: 32px; }
}
</style>
