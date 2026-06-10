<template>
  <div
    class="bg-page"
    @click="onInteract"
    @touchstart.passive="onInteract"
  >
    <!-- ════════════════════════════════════════
         PHASE: selecting（背景选择）
    ════════════════════════════════════════ -->
    <template v-if="phase === 'selecting'">
      <!-- Left panel: header + photo previews -->
      <div class="bg-left">
        <header class="bg-header">
          <button class="back-btn" @click.stop="goBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <StepIndicator :current="2" :total="3" />
          <LanguageSwitcher />
        </header>

        <div class="bg-content">
          <div class="photo-panel">
            <div class="panel-label">{{ t('background.original') }}</div>
            <img :src="store.photoDataUrl" :alt="t('background.original')" class="photo-img" />
          </div>
          <div class="composite-panel">
            <div class="panel-label">{{ t('background.preview') }}</div>
            <CompositeCanvas :dataUrl="store.compositeDataUrl" />
          </div>
        </div>
      </div>

      <!-- Right panel: gallery + confirm -->
      <div class="bg-right">
        <div class="gallery-section">
          <div class="section-title">{{ t('background.selectBg') }}</div>
          <BackgroundGallery
            :selectedId="store.selectedBackground?.id"
            @select="handleSelectBackground"
            @error="showError"
          />
        </div>

        <footer class="bg-footer">
          <button
            class="btn btn-primary"
            :disabled="!store.compositeDataUrl || store.isUploading || store.isSegmenting"
            @click.stop="handleConfirm"
          >
            <span v-if="store.isUploading">{{ t('background.uploading') }}</span>
            <span v-else>{{ t('background.generateQR') }}</span>
          </button>
        </footer>
      </div>
    </template>

    <!-- ════════════════════════════════════════
         PHASE: result / default-result（合成结果 + 二维码）
         两种结果阶段复用同一套布局，通过 computed 区分数据源
    ════════════════════════════════════════ -->
    <template v-else>
      <!-- Left: composite image -->
      <div class="result-left">
        <!-- 合成完成 -->
        <div v-if="displayDataUrl" class="photo-frame">
          <img :src="displayDataUrl" :alt="t('result.success')" class="result-img" />
          <div class="success-badge">
            <svg viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="10" fill="#4caf50"/>
              <polyline points="5,10 9,14 15,7" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ t('result.success') }}</span>
          </div>
        </div>
        <!-- 合成中（默认背景处理阶段短暂出现） -->
        <div v-else class="compositing-ph">
          <div class="compositing-spinner"></div>
          <p class="compositing-text">合成中...</p>
        </div>
      </div>

      <!-- Right: step + [tabs] + QR + reset + actions -->
      <div class="result-right">
        <header class="result-header">
          <div style="width:44px"></div>
          <StepIndicator :current="3" :total="3" />
          <LanguageSwitcher />
        </header>

        <!-- 默认背景切换 Tab（仅在 default-result 且有多张默认背景时显示） -->
        <div
          v-if="phase === 'default-result' && defaultItems.length > 1"
          class="default-tabs"
        >
          <button
            v-for="(item, idx) in defaultItems"
            :key="item.bg.id"
            :class="['tab-btn', { active: activeDefaultIdx === idx }]"
            @click.stop="activeDefaultIdx = idx"
          >
            <img :src="item.bg.thumbnail" class="tab-thumb" />
            <!-- 合成中的 tab 显示 loading 遮罩 -->
            <div v-if="item.isCompositing" class="tab-overlay">
              <span class="spinner-xs"></span>
            </div>
          </button>
        </div>

        <!-- QR 码或加载中 -->
        <div class="qr-wrap">
          <QRCodeDisplay
            v-if="displayQrUrl"
            :url="displayQrUrl"
            :qrSize="qrSize"
          />
          <div v-else class="qr-pending">
            <div class="qr-spinner"></div>
            <span>{{ qrLoadingText }}</span>
          </div>

        </div>

        <!-- 自动重置倒计时 -->
        <div class="auto-reset-bar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="8" cy="8" r="6.5"/>
            <path d="M8 5v3.5L10.5 11"/>
          </svg>
          <span>{{ t('result.autoReset', { n: resetSeconds }) }}</span>
          <span class="touch-hint">· {{ t('result.touchToKeep') }}</span>
        </div>

        <!-- 操作按钮 -->
        <footer class="result-footer">
          <button class="btn btn-outline" @click.stop="handleRetake">
            {{ t('result.retake') }}
          </button>
          <button class="btn btn-primary" @click.stop="handleChangeBackground">
            {{ phase === 'default-result' ? '自定义背景' : t('result.changeBg') }}
          </button>
        </footer>
      </div>
    </template>

    <LoadingOverlay :visible="store.isSegmenting" :text="t('background.processing')" />
    <LoadingOverlay :visible="store.isUploading" :text="t('background.uploading')" />
    <ErrorToast :message="errorMsg" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePhotoStore } from '@/stores/photoStore'
import { useSegmentation } from '@/composables/useSegmentation'
import { useCanvas } from '@/composables/useCanvas'
import { uploadImage } from '@/services/uploadService'
import { getDefaultBgs } from '@/services/defaultBgService'
import BackgroundGallery from '@/components/background/BackgroundGallery.vue'
import CompositeCanvas from '@/components/canvas/CompositeCanvas.vue'
import QRCodeDisplay from '@/components/result/QRCodeDisplay.vue'
import StepIndicator from '@/components/common/StepIndicator.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import ErrorToast from '@/components/common/ErrorToast.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const store = usePhotoStore()
const { segment, ensureReady } = useSegmentation()
const { composite } = useCanvas()

const errorMsg = ref('')
// 缓存透明人像：分割结果只与照片相关，切换背景无需重复请求
const cachedPerson = ref(null)

// ── 阶段控制 ─────────────────────────────────────────────
// 'selecting'       → 手动选背景
// 'result'          → 手动选背景 → 确认 → 上传完毕
// 'default-result'  → 有默认背景 → 自动合成完毕
const phase = ref('selecting')

// ── 默认背景合成状态 ──────────────────────────────────────
// 每项：{ bg, dataUrl, downloadUrl, isCompositing, isUploading }
const defaultItems = ref([])
const activeDefaultIdx = ref(0)

const activeItem = computed(() => defaultItems.value[activeDefaultIdx.value] ?? null)

// 根据当前阶段决定展示的合成图与二维码 URL
const displayDataUrl = computed(() => {
  if (phase.value === 'default-result') return activeItem.value?.dataUrl ?? null
  return store.compositeDataUrl
})
const displayQrUrl = computed(() => {
  if (phase.value === 'default-result') return activeItem.value?.downloadUrl ?? null
  return store.downloadUrl
})
const qrLoadingText = computed(() => {
  if (phase.value !== 'default-result') return '处理中...'
  const item = activeItem.value
  if (!item) return '处理中...'
  if (item.isCompositing) return '合成中...'
  if (item.isUploading) return '上传中...'
  return '处理中...'
})

// ── 自动重置（结果阶段）──────────────────────────────────
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

function onInteract() {
  if (phase.value !== 'selecting') resetSeconds.value = RESET_TOTAL
}

const qrSize = computed(() => {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w / h >= 2) return 300
  if (w <= 375) return 160
  if (w <= 414) return 180
  return 200
})

// ── 错误提示 ─────────────────────────────────────────────
function showError(msg) {
  errorMsg.value = msg
  setTimeout(() => { errorMsg.value = '' }, 4000)
}

function goBack() {
  router.push('/camera')
}

// ── 默认背景：逐一合成（canvas）+ 后台上传 ─────────────────
async function compositeOneDefault(idx) {
  try {
    const dataUrl = await composite(defaultItems.value[idx].bg.src, cachedPerson.value)
    defaultItems.value[idx].dataUrl = dataUrl
    defaultItems.value[idx].isCompositing = false
    defaultItems.value[idx].isUploading = true

    // 上传（后台，不阻塞）
    uploadImage(dataUrl)
      .then(({ id, url }) => {
        defaultItems.value[idx].downloadUrl = url
        defaultItems.value[idx].uploadedId  = id
        defaultItems.value[idx].isUploading = false
      })
      .catch(() => {
        defaultItems.value[idx].isUploading = false
      })
  } catch {
    defaultItems.value[idx].isCompositing = false
  }
}

// ── onMounted：获取分割结果，判断是否走默认背景流程 ──────────
onMounted(async () => {
  // 读取默认背景列表
  const defaults = getDefaultBgs()

  if (defaults.length > 0) {
    // ✅ 有默认背景 → 直接进入 default-result 阶段
    phase.value = 'default-result'
    defaultItems.value = defaults.map(bg => ({
      bg,
      dataUrl: null,
      downloadUrl: null,
      uploadedId: null,
      isCompositing: true,
      isUploading: false,
    }))
  }

  store.isSegmenting = true
  try {
    await ensureReady()

    // 获取透明人像（预分割 / 等待中 / 重新分割）
    if (store.segmentedPerson) {
      // 预分割已完成
      cachedPerson.value = store.segmentedPerson
    } else if (store.isPreSegmenting) {
      // 预分割进行中，等待
      try {
        const promise = store.awaitPreSegment()
        if (promise) await promise
        if (store.segmentedPerson) {
          cachedPerson.value = store.segmentedPerson
        } else {
          throw new Error('no result')
        }
      } catch {
        cachedPerson.value = await segment(store.photoDataUrl)
      }
    } else {
      cachedPerson.value = await segment(store.photoDataUrl)
    }

    if (phase.value === 'default-result') {
      // 并行合成所有默认背景（canvas 速度快，约 100ms/张）
      // 等待全部合成完毕后再隐藏 loading
      await Promise.allSettled(
        defaultItems.value.map((_, idx) => compositeOneDefault(idx))
      )
      store.isSegmenting = false
      startAutoReset()
    } else {
      // 普通选背景流程
      store.isSegmenting = false
      if (store.selectedBackground && !store.compositeDataUrl) {
        const resultDataUrl = await composite(store.selectedBackground.src, cachedPerson.value)
        store.setComposite(resultDataUrl)
      }
    }
  } catch (err) {
    store.isSegmenting = false
    showError(err.message || t('error.segmentFailed'))
    if (phase.value === 'default-result') {
      // 分割失败 → 退回到手动选择
      phase.value = 'selecting'
    }
  }
})

onUnmounted(() => {
  clearInterval(autoResetInterval)
})

// ── 选背景（selecting 阶段） ──────────────────────────────
async function handleSelectBackground(bg) {
  store.selectBackground(bg)
  store.isSegmenting = true
  errorMsg.value = ''
  try {
    if (!cachedPerson.value) {
      cachedPerson.value = await segment(store.photoDataUrl)
    }
    const resultDataUrl = await composite(bg.src, cachedPerson.value)
    store.setComposite(resultDataUrl)
  } catch (err) {
    showError(err.message || t('error.segmentFailed'))
    store.setComposite(null)
  } finally {
    store.isSegmenting = false
  }
}

// ── 确认 → 上传 → 进入 result 阶段（手动选背景流程）────────
async function handleConfirm() {
  if (!store.compositeDataUrl) return

  store.isUploading = true
  errorMsg.value = ''
  try {
    const { id, url } = await uploadImage(store.compositeDataUrl)
    store.setUploadResult({ id, url })
    phase.value = 'result'
    startAutoReset()
  } catch (err) {
    showError(err.message || t('error.uploadFailed'))
  } finally {
    store.isUploading = false
  }
}

// ── 结果操作 ─────────────────────────────────────────────
function handleRetake() {
  clearInterval(autoResetInterval)
  store.resetAll()
  router.push('/')
}

function handleChangeBackground() {
  clearInterval(autoResetInterval)
  // 清除结果状态，保留 cachedPerson（无需重新分割）
  store.compositeDataUrl = null
  store.uploadedImageId = null
  store.downloadUrl = null
  store.selectedBackground = null
  phase.value = 'selecting'
}
</script>

<style scoped>
/* ── Base wrapper ──────────────────────────────────────── */
.bg-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-dark);
  overflow: hidden;
}

/* ── Shared ────────────────────────────────────────────── */
.back-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.back-btn svg { width: 20px; height: 20px; }
.btn {
  height: 52px; border-radius: 26px;
  font-size: 15px; font-weight: 600; transition: all 0.2s;
}
.btn-primary { background: #6c63ff; color: white; }
.btn-primary:active:not(:disabled) { background: #4a42d4; }
.btn-primary:disabled { background: rgba(108,99,255,0.35); color: rgba(255,255,255,0.5); }
.btn-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.25); }
.btn-outline:active { background: rgba(255,255,255,0.08); }

/* ══════════════════════════════════════════════════════════
   PHASE: selecting
══════════════════════════════════════════════════════════ */
.bg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: calc(12px + var(--safe-top)) 16px 12px;
  flex-shrink: 0;
}
.bg-content {
  display: flex; flex: 1; gap: 10px;
  padding: 0 12px; overflow: hidden; min-height: 0;
}
.photo-panel, .composite-panel {
  flex: 1; display: flex; flex-direction: column;
  gap: 6px; overflow: hidden; min-height: 0;
}
.panel-label {
  font-size: 12px; color: rgba(255,255,255,0.5);
  text-align: center; flex-shrink: 0;
}
.photo-img {
  width: 100%; flex: 1; object-fit: contain;
  border-radius: 12px; background: rgba(0,0,0,0.3); min-height: 0;
}
.gallery-section { flex-shrink: 0; padding-top: 4px; }
.section-title { font-size: 13px; color: rgba(255,255,255,0.6); padding: 0 16px 2px; }
.bg-footer {
  flex-shrink: 0;
  padding: 12px 24px calc(16px + var(--safe-bottom));
}
.bg-footer .btn { width: 100%; }

/* ══════════════════════════════════════════════════════════
   PHASE: result / default-result
══════════════════════════════════════════════════════════ */
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

/* 合成占位（等待合成时短暂显示） */
.compositing-ph {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 14px; width: 100%; aspect-ratio: 4/3;
  border-radius: 16px; background: rgba(255,255,255,0.04);
}
.compositing-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.compositing-text { color: rgba(255,255,255,0.4); font-size: 14px; margin: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 默认背景切换 Tab ────────────────────────────────── */
.default-tabs {
  display: flex; gap: 10px; justify-content: center;
  padding: 4px 0 2px;
  flex-shrink: 0;
}
.tab-btn {
  position: relative;
  width: 56px; height: 56px; border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.15s;
  flex-shrink: 0;
}
.tab-btn.active {
  border-color: #6c63ff;
  box-shadow: 0 0 0 2px rgba(108,99,255,0.4);
  transform: scale(1.06);
}
.tab-thumb {
  width: 100%; height: 100%; object-fit: cover;
  display: block;
}
.tab-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.spinner-xs {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── QR 加载占位 ─────────────────────────────────────── */
.qr-wrap { flex-shrink: 0; padding: 12px 0 4px; }
.qr-pending {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; padding: 20px;
  color: rgba(255,255,255,0.4); font-size: 13px;
}
.qr-spinner {
  width: 32px; height: 32px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ── Auto-reset / footer ─────────────────────────────── */
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
  display: flex; gap: 12px; width: 100%;
  padding: 8px 24px calc(20px + var(--safe-bottom, 0px));
}
.result-footer .btn { flex: 1; }

/* ── Wide screen (32:9 kiosk) ─────────────────────────── */
@media (min-aspect-ratio: 2/1) {
  .bg-page { flex-direction: row; }

  /* selecting phase */
  .bg-left {
    width: 55%; height: 100%;
    display: flex; flex-direction: column;
    border-right: 1px solid rgba(255,255,255,0.07);
  }
  .bg-header { padding: 20px 24px; }
  .bg-content { flex: 1; padding: 0 24px 24px; gap: 16px; }
  .photo-img { border-radius: 16px; }
  .panel-label { font-size: 14px; }
  .bg-right {
    flex: 1; height: 100%;
    display: flex; flex-direction: column;
    padding-top: 20px;
  }
  .gallery-section { flex: 1; overflow: hidden; }
  .section-title { font-size: 15px; padding: 0 24px 8px; }
  .bg-footer { padding: 16px 32px 24px; }
  .bg-footer .btn { height: 64px; font-size: 18px; border-radius: 32px; }

  /* result / default-result phase */
  .result-left {
    width: 55%; flex: none; height: 100%;
    padding: 32px 24px 32px 40px;
    align-items: center;
  }
  .photo-frame { width: 100%; max-height: 100%; }
  .result-img { max-height: 85vh; }
  .result-right {
    flex: 1; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 24px 48px; gap: 12px;
    border-left: 1px solid rgba(255,255,255,0.07);
  }
  .result-header { padding: 0; width: 100%; }
  .qr-wrap { padding: 0; }
  .auto-reset-bar { font-size: 14px; }
  .auto-reset-bar svg { width: 16px; height: 16px; }
  .result-footer { padding: 0; gap: 16px; width: 100%; }
  .result-footer .btn { height: 64px; font-size: 18px; border-radius: 32px; }

  /* Larger tabs on kiosk */
  .default-tabs { gap: 14px; padding: 4px 0; }
  .tab-btn { width: 80px; height: 80px; border-radius: 14px; }
}
</style>
