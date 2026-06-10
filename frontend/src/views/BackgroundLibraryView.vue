<template>
  <div class="bglib-page">
    <header class="bglib-header">
      <button class="back-btn" @click="router.push('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h2 class="header-title">{{ t('bgLib.title') }}</h2>
      <LanguageSwitcher />
    </header>

    <div class="toolbar">
      <input ref="fileInputRef" type="file" accept="image/*" class="hidden-input" @change="handleUpload" />
      <button class="upload-btn" @click="fileInputRef?.click()" :disabled="uploading">
        <svg v-if="!uploading" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M10 13V3M6 7l4-4 4 4"/>
          <path d="M3 17h14"/>
        </svg>
        <span v-if="uploading" class="spinner-sm"></span>
        {{ uploading ? t('background.uploading') : t('bgLib.upload') }}
      </button>

      <!-- 默认背景计数 -->
      <div class="default-count" :class="{ full: defaultList.length >= MAX_DEFAULTS }">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
        <span>默认背景 {{ defaultList.length }} / {{ MAX_DEFAULTS }}</span>
        <span v-if="defaultList.length >= MAX_DEFAULTS" class="full-hint">（已满）</span>
      </div>
    </div>

    <div v-if="loading" class="state-wrap">
      <div class="spinner"></div>
    </div>

    <div v-else-if="bgs.length === 0" class="state-wrap empty">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.2">
        <rect x="4" y="4" width="56" height="56" rx="8"/>
        <line x1="32" y1="20" x2="32" y2="44"/>
        <line x1="20" y1="32" x2="44" y2="32"/>
      </svg>
      <p class="empty-title">{{ t('bgLib.empty') }}</p>
      <p class="empty-hint">{{ t('bgLib.emptyHint') }}</p>
    </div>

    <div v-else class="bg-grid">
      <div v-for="bg in bgs" :key="bg.id" class="bg-card">
        <img :src="bg.thumbnail" loading="lazy" />

        <!-- 设为默认按钮（左上角星形）-->
        <button
          class="star-btn"
          :class="{ active: isDefault(bg.id) }"
          :title="isDefault(bg.id) ? '取消默认' : (defaultList.length >= MAX_DEFAULTS ? '默认背景已满' : '设为默认')"
          :disabled="!isDefault(bg.id) && defaultList.length >= MAX_DEFAULTS"
          @click.stop="handleToggleDefault(bg)"
        >
          <!-- 实心星：已选为默认 -->
          <svg v-if="isDefault(bg.id)" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          <!-- 空心星：未选 -->
          <svg v-else viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </button>

        <!-- 删除按钮（右上角） -->
        <button class="del-btn" @click="handleDelete(bg)" :title="t('background.deleteBg')">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
          </svg>
        </button>

        <!-- 默认标签 -->
        <div v-if="isDefault(bg.id)" class="default-badge">
          默认
        </div>
      </div>
    </div>

    <div v-if="errorMsg" class="error-bar">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { listBgs, uploadBg, deleteBg } from '@/services/bgService'
import {
  getDefaultBgs,
  toggleDefaultBg,
  removeFromDefaults,
  isDefaultBg,
  MAX_DEFAULTS
} from '@/services/defaultBgService'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()

const bgs = ref([])
const loading = ref(true)
const uploading = ref(false)
const errorMsg = ref('')
const fileInputRef = ref(null)

// 默认背景列表（响应式，驱动 UI）
const defaultList = ref(getDefaultBgs())

function isDefault(id) {
  return defaultList.value.some(d => d.id === id)
}

function showError(msg) {
  errorMsg.value = msg
  setTimeout(() => { errorMsg.value = '' }, 4000)
}

onMounted(async () => {
  try { bgs.value = await listBgs() }
  catch { bgs.value = [] }
  finally { loading.value = false }
})

async function handleUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  uploading.value = true
  try {
    const result = await uploadBg(file)
    bgs.value.unshift({ id: result.id, src: result.src, thumbnail: result.src })
  } catch (err) {
    showError(err.message || t('error.bgUploadFailed'))
  } finally {
    uploading.value = false
  }
}

async function handleDelete(bg) {
  if (!confirm(t('bgLib.confirmDelete'))) return
  try {
    await deleteBg(bg.id)
    bgs.value = bgs.value.filter(b => b.id !== bg.id)
    // 同步从默认列表移除
    defaultList.value = removeFromDefaults(bg.id)
  } catch (err) {
    showError(err.message || t('error.bgDeleteFailed'))
  }
}

function handleToggleDefault(bg) {
  defaultList.value = toggleDefaultBg(bg)
}
</script>

<style scoped>
.bglib-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: #0a0a1a;
  overflow: hidden;
}
.bglib-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(12px + var(--safe-top, 0px)) 16px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.back-btn {
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center; color: white;
}
.back-btn svg { width: 20px; height: 20px; }
.header-title { font-size: 18px; font-weight: 600; color: white; margin: 0; }

.toolbar {
  padding: 10px 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.hidden-input { display: none; }
.upload-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: #6c63ff; color: white;
  padding: 10px 20px; border-radius: 20px;
  font-size: 14px; font-weight: 600;
  transition: background 0.2s;
}
.upload-btn:disabled { background: rgba(108,99,255,0.4); }
.upload-btn:not(:disabled):active { background: #4a42d4; }
.upload-btn svg { width: 18px; height: 18px; }
.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 默认背景计数标签 */
.default-count {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 20px;
  background: rgba(255,255,255,0.07);
  color: rgba(255,255,255,0.5);
  font-size: 13px;
}
.default-count svg { width: 14px; height: 14px; color: rgba(255,255,255,0.3); }
.default-count.full { background: rgba(108,99,255,0.15); color: #a89bff; }
.default-count.full svg { color: #6c63ff; }
.full-hint { font-size: 11px; color: rgba(108,99,255,0.6); }

.state-wrap {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; color: rgba(255,255,255,0.3);
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #6c63ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.empty svg { width: 72px; height: 72px; }
.empty-title { font-size: 16px; color: rgba(255,255,255,0.5); margin: 0; }
.empty-hint { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; text-align: center; padding: 0 32px; }

.bg-grid {
  flex: 1; overflow-y: auto; padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(120px, 18vw, 220px), 1fr));
  gap: 10px;
  align-content: start;
}
.bg-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16/9;
  background: #111;
}
.bg-card img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.2s;
}
.bg-card:hover img { transform: scale(1.04); }

/* 删除按钮（右上角） */
.del-btn {
  position: absolute; top: 6px; right: 6px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  color: white; opacity: 0; transition: opacity 0.2s;
}
.bg-card:hover .del-btn { opacity: 1; }
.del-btn svg { width: 10px; height: 10px; }

/* 星形默认按钮（左上角） */
.star-btn {
  position: absolute; top: 6px; left: 6px;
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.5);
  opacity: 0; transition: opacity 0.2s, color 0.2s;
}
.bg-card:hover .star-btn { opacity: 1; }
.star-btn.active {
  opacity: 1;
  color: #fbbf24;   /* 金黄 */
  background: rgba(251,191,36,0.2);
}
.star-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.star-btn svg { width: 14px; height: 14px; }

/* 默认角标 */
.default-badge {
  position: absolute; bottom: 6px; left: 6px;
  background: rgba(251,191,36,0.9);
  color: #7a4f00; font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px;
  pointer-events: none;
}

.error-bar {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #e53935; color: white;
  padding: 10px 20px; border-radius: 8px; font-size: 14px;
  z-index: 50;
}

/* ── Wide screen (32:9 kiosk) ────────────── */
@media (min-aspect-ratio: 2/1) {
  .bglib-header { padding: 20px 32px; }
  .header-title { font-size: 24px; }
  .back-btn { width: 52px; height: 52px; }
  .back-btn svg { width: 22px; height: 22px; }

  .toolbar { padding: 12px 24px; gap: 16px; }
  .upload-btn { height: 48px; padding: 0 28px; font-size: 15px; border-radius: 24px; }
  .upload-btn svg { width: 20px; height: 20px; }
  .default-count { font-size: 14px; padding: 9px 18px; }

  .bg-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    padding: 16px 24px;
    gap: 14px;
  }
  /* 触控 kiosk：始终显示操作按钮 */
  .del-btn, .star-btn { opacity: 1; }
  .del-btn { width: 32px; height: 32px; top: 8px; right: 8px; }
  .del-btn svg { width: 12px; height: 12px; }
  .star-btn { width: 36px; height: 36px; top: 8px; left: 8px; }
  .star-btn svg { width: 16px; height: 16px; }
  .default-badge { font-size: 12px; padding: 3px 10px; bottom: 8px; left: 8px; }
}
</style>
