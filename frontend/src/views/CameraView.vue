<template>
  <div class="camera-page">
    <!-- Left panel: camera preview -->
    <div class="cam-left">
      <div class="camera-area" v-if="!capturedPhoto">
        <CameraPreview
          ref="previewRef"
          :stream="cameraStream"
          :facingMode="store.facingMode"
          :loading="camLoading"
          :loadingText="t('camera.startingCamera')"
          @ready="onVideoReady"
        />
        <div class="viewfinder">
          <span class="corner tl"></span><span class="corner tr"></span>
          <span class="corner bl"></span><span class="corner br"></span>
        </div>
      </div>
      <div class="camera-area preview-area" v-else>
        <img :src="capturedPhoto" alt="photo" class="captured-img" />
      </div>
    </div>

    <!-- Right panel: header + controls -->
    <div class="cam-right">
      <header class="camera-header">
        <button class="back-btn" @click="router.push('/')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <p class="hint-text">{{ t('camera.hint') }}</p>
        <LanguageSwitcher />
      </header>

      <footer class="camera-footer">
        <template v-if="!capturedPhoto">
          <div class="timer-row">
            <button
              v-for="val in [0, 3, 5, 10]"
              :key="val"
              class="timer-btn"
              :class="{ active: timerMode === val }"
              @click="timerMode = val"
            >
              {{ val === 0 ? t('camera.timerOff') : val + 's' }}
            </button>
          </div>
          <CameraControls
            :disabled="camLoading || !!camError"
            :switchTitle="t('camera.switchCamera')"
            @capture="handleCapture"
            @toggle="handleToggle"
          />
        </template>
        <template v-else>
          <div class="after-capture">
            <button class="btn btn-outline" @click="retake">{{ t('camera.retake') }}</button>
            <button class="btn btn-primary" @click="confirm">{{ t('camera.usePhoto') }}</button>
          </div>
        </template>
      </footer>
    </div>

    <!-- Countdown overlay -->
    <Transition name="cd-fade">
      <div v-if="countdown > 0" class="countdown-overlay" @click="cancelCountdown">
        <div class="countdown-number" :key="countdown">{{ countdown }}</div>
        <p class="countdown-hint">{{ t('camera.countdownHint') }}</p>
      </div>
    </Transition>

    <ErrorToast :message="camError" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePhotoStore } from '@/stores/photoStore'
import { useCamera } from '@/composables/useCamera'
import { useSegmentation } from '@/composables/useSegmentation'
import CameraPreview from '@/components/camera/CameraPreview.vue'
import CameraControls from '@/components/camera/CameraControls.vue'
import ErrorToast from '@/components/common/ErrorToast.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const store = usePhotoStore()
const { stream: cameraStream, error: camError, isLoading: camLoading, startCamera, stopCamera, takePhoto } = useCamera()
const { segment } = useSegmentation()

const videoEl = ref(null)
const capturedPhoto = ref(null)
const timerMode = ref(0)
const countdown = ref(0)
let countdownTimer = null

async function openCamera() { await startCamera(store.facingMode) }
function onVideoReady(el) { videoEl.value = el }

function handleCapture() {
  if (!videoEl.value) return
  timerMode.value === 0 ? doTakePhoto() : startCountdown(timerMode.value)
}

function startCountdown(seconds) {
  countdown.value = seconds
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      doTakePhoto()
    }
  }, 1000)
}

function cancelCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  countdown.value = 0
}

function doTakePhoto() {
  countdown.value = 0
  capturedPhoto.value = takePhoto(videoEl.value)
  stopCamera()
}

async function handleToggle() { store.toggleCamera(); await startCamera(store.facingMode) }
function retake() { capturedPhoto.value = null; openCamera() }
function confirm() {
  const photoDataUrl = capturedPhoto.value
  store.setPhoto(photoDataUrl)
  // 拍完立即在后台开始预分割，导航到背景页时可能已完成，消灭等待感
  const rawPromise = segment(photoDataUrl)
  store.beginPreSegment(rawPromise)
  rawPromise
    .then(img => store.resolvePreSegment(img))
    .catch(err => store.rejectPreSegment(err.message || '预分割失败'))
  router.push('/background')
}

onMounted(openCamera)
onUnmounted(() => { stopCamera(); cancelCountdown() })
</script>

<style scoped>
/* ── Base (portrait / mobile) ─────────────── */
.camera-page {
  display: flex; flex-direction: column;
  width: 100vw; height: 100vh; height: 100dvh;
  background: #0a0a1a; overflow: hidden;
}

/* cam-left: holds the camera preview, fills available space */
.cam-left {
  flex: 1; display: flex; flex-direction: column;
  min-height: 0; padding: 0 12px;
}

/* cam-right: header + footer in column in normal mode */
.cam-right {
  flex-shrink: 0;
  display: flex; flex-direction: column;
}

.camera-header {
  padding: calc(12px + var(--safe-top, 0px)) 16px 12px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; position: relative; flex-shrink: 0;
}
.back-btn {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;
}
.back-btn svg { width: 20px; height: 20px; }
.hint-text {
  position: absolute; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.5); font-size: 13px; white-space: nowrap;
}

.camera-area {
  flex: 1; position: relative; overflow: hidden; border-radius: 16px;
  margin: 8px 0;
}
.preview-area { display: flex; align-items: center; justify-content: center; background: #000; }
.captured-img { width: 100%; height: 100%; object-fit: cover; }
.viewfinder { position: absolute; inset: 20px; pointer-events: none; }
.corner { position: absolute; width: 24px; height: 24px; border-color: rgba(255,255,255,0.7); border-style: solid; }
.corner.tl { top:0;left:0; border-width:2px 0 0 2px; }
.corner.tr { top:0;right:0; border-width:2px 2px 0 0; }
.corner.bl { bottom:0;left:0; border-width:0 0 2px 2px; }
.corner.br { bottom:0;right:0; border-width:0 2px 2px 0; }

.camera-footer {
  flex-shrink: 0;
  padding: 12px 0 calc(24px + var(--safe-bottom, 0px));
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.timer-row { display: flex; gap: 8px; }
.timer-btn {
  padding: 6px 16px; border-radius: 20px;
  font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  transition: all 0.15s;
}
.timer-btn.active { background: #6c63ff; border-color: #6c63ff; color: white; }
.after-capture { display: flex; gap: 16px; width: 100%; padding: 0 24px; }
.btn { flex:1; height:52px; border-radius:26px; font-size:16px; font-weight:600; transition:all 0.2s; }
.btn-primary { background:#6c63ff; color:white; }
.btn-primary:active { background:#4a42d4; }
.btn-outline { background:transparent; color:white; border:2px solid rgba(255,255,255,0.3); }
.btn-outline:active { background:rgba(255,255,255,0.1); }

/* Countdown overlay */
.countdown-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.72);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; z-index: 200; cursor: pointer;
}
.countdown-number {
  font-size: clamp(120px, 20vw, 280px);
  font-weight: 800; color: white; line-height: 1;
  animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  text-shadow: 0 0 60px rgba(108,99,255,0.9);
}
@keyframes pop-in {
  from { transform: scale(1.6); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
.countdown-hint { color: rgba(255,255,255,0.55); font-size: 16px; margin: 0; }
.cd-fade-enter-active, .cd-fade-leave-active { transition: opacity 0.2s; }
.cd-fade-enter-from, .cd-fade-leave-to { opacity: 0; }

/* ── Wide screen (32:9 kiosk) ────────────── */
@media (min-aspect-ratio: 2/1) {
  .camera-page { flex-direction: row; }

  /* Left half: camera preview */
  .cam-left {
    width: 50%; flex: none; height: 100%;
    padding: 20px; justify-content: center;
  }
  .camera-area { margin: 0; border-radius: 20px; height: 100%; }

  /* Right half: header + controls */
  .cam-right {
    flex: 1; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 32px 64px;
    gap: 0;
    border-left: 1px solid rgba(255,255,255,0.06);
  }

  .camera-header {
    width: 100%; padding: 0 0 32px;
    position: static; /* remove relative so hint-text doesn't go absolute */
  }
  .hint-text {
    position: static; transform: none;
    font-size: 16px; color: rgba(255,255,255,0.45);
    text-align: center; flex: 1;
  }
  .back-btn { width: 52px; height: 52px; }
  .back-btn svg { width: 22px; height: 22px; }

  .camera-footer {
    width: 100%; padding: 0; gap: 32px; flex: 1; justify-content: center;
  }
  .timer-row { gap: 12px; }
  .timer-btn { padding: 10px 22px; font-size: 15px; }
  .after-capture { padding: 0; }
  .btn { height: 64px; font-size: 18px; border-radius: 32px; }
}
</style>
