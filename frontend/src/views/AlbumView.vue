<template>
  <div class="album-page">
    <header class="album-header">
      <button class="back-btn" @click="router.push('/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h2 class="header-title">{{ t('album.title') }}</h2>
      <LanguageSwitcher />
    </header>

    <div v-if="loading" class="state-wrap">
      <div class="spinner"></div>
    </div>

    <div v-else-if="photos.length === 0" class="state-wrap empty">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.2">
        <rect x="4" y="10" width="56" height="44" rx="6"/>
        <circle cx="20" cy="26" r="7"/>
        <path d="M4 46 l18-14 14 14 10-8 14 12"/>
      </svg>
      <p class="empty-title">{{ t('album.empty') }}</p>
      <p class="empty-hint">{{ t('album.emptyHint') }}</p>
    </div>

    <div v-else class="photo-grid">
      <div v-for="photo in photos" :key="photo.id" class="photo-card">
        <img :src="photo.src" loading="lazy" @click="openFull(photo)" />
        <div class="card-actions">
          <a :href="photo.src" download class="action-btn" :title="t('album.download')" @click.stop>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M10 3v10M6 9l4 4 4-4"/>
              <path d="M3 17h14"/>
            </svg>
          </a>
          <button class="action-btn action-del" :title="t('album.delete')" @click.stop="handleDelete(photo)">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M5 5l10 10M15 5L5 15"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Transition name="fade">
      <div v-if="fullPhoto" class="lightbox" @click="fullPhoto = null">
        <img :src="fullPhoto.src" @click.stop />
        <button class="lb-close" @click="fullPhoto = null">✕</button>
        <div class="lb-actions" @click.stop>
          <a :href="fullPhoto.src" download class="lb-btn lb-dl">{{ t('album.download') }}</a>
          <button class="lb-btn lb-del" @click="handleDeleteFromLightbox(fullPhoto)">
            {{ t('album.delete') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()

const photos = ref([])
const loading = ref(true)
const fullPhoto = ref(null)

function openFull(photo) { fullPhoto.value = photo }

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

async function handleDelete(photo) {
  if (!confirm(t('album.confirmDelete'))) return
  try {
    await axios.delete(`/api/photos/${encodeURIComponent(photo.id)}`)
    photos.value = photos.value.filter(p => p.id !== photo.id)
  } catch (err) {
    alert(err.message || 'Delete failed')
  }
}

async function handleDeleteFromLightbox(photo) {
  if (!confirm(t('album.confirmDelete'))) return
  try {
    await axios.delete(`/api/photos/${encodeURIComponent(photo.id)}`)
    photos.value = photos.value.filter(p => p.id !== photo.id)
    fullPhoto.value = null
  } catch (err) {
    alert(err.message || 'Delete failed')
  }
}
</script>

<style scoped>
.album-page {
  display: flex; flex-direction: column;
  width: 100vw; height: 100vh; height: 100dvh;
  background: #0a0a1a; overflow: hidden; color: white;
}
.album-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: calc(12px + var(--safe-top, 0px)) 20px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.back-btn {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center; color: white;
}
.back-btn svg { width: 20px; height: 20px; }
.header-title { font-size: 18px; font-weight: 600; color: white; margin: 0; }

.state-wrap {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; color: rgba(255,255,255,0.3);
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #6c63ff;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty svg { width: 72px; height: 72px; }
.empty-title { font-size: 16px; color: rgba(255,255,255,0.5); margin: 0; }
.empty-hint { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; text-align: center; padding: 0 32px; }

/* Photo grid */
.photo-grid {
  flex: 1; overflow-y: auto; padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 22vw, 280px), 1fr));
  gap: 10px; align-content: start;
}
.photo-card {
  position: relative; border-radius: 12px;
  overflow: hidden; background: #111; aspect-ratio: 16/9; cursor: pointer;
}
.photo-card img {
  width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s;
}
.photo-card:hover img { transform: scale(1.03); }

/* Action buttons */
.card-actions {
  position: absolute; bottom: 6px; right: 6px;
  display: flex; gap: 5px;
  opacity: 0; transition: opacity 0.2s;
}
.photo-card:hover .card-actions { opacity: 1; }
.action-btn {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(0,0,0,0.72); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  color: white; text-decoration: none; cursor: pointer; border: none;
}
.action-btn svg { width: 14px; height: 14px; }
.action-del:active { background: rgba(200,40,40,0.85); }

/* Lightbox */
.lightbox {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.93);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.lightbox img { max-width: 88vw; max-height: 80vh; object-fit: contain; border-radius: 8px; }
.lb-close {
  position: absolute; top: 20px; right: 20px;
  color: white; font-size: 22px;
  background: rgba(255,255,255,0.1); border-radius: 50%;
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
}
.lb-actions {
  position: absolute; bottom: 28px;
  display: flex; gap: 12px;
}
.lb-btn {
  height: 52px; border-radius: 26px;
  font-size: 15px; font-weight: 600; padding: 0 32px;
  text-decoration: none; display: flex; align-items: center;
  cursor: pointer; border: none; transition: filter 0.15s;
}
.lb-btn:active { filter: brightness(0.85); }
.lb-dl { background: #6c63ff; color: white; }
.lb-del { background: rgba(200,40,40,0.85); color: white; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Wide screen (32:9 kiosk) ────────────── */
@media (min-aspect-ratio: 2/1) {
  .album-header { padding: 20px 32px; }
  .header-title { font-size: 24px; }
  .back-btn { width: 52px; height: 52px; }
  .back-btn svg { width: 22px; height: 22px; }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    padding: 16px 24px; gap: 14px;
  }
  /* Always show actions (touch screen, no hover) */
  .card-actions { opacity: 1; }
  .action-btn { width: 42px; height: 42px; }
  .action-btn svg { width: 17px; height: 17px; }

  .lightbox img { max-width: 60vw; max-height: 86vh; }
  .lb-btn { height: 60px; font-size: 17px; padding: 0 40px; }
  .lb-close { width: 56px; height: 56px; font-size: 24px; }
}
</style>
