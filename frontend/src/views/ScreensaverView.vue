<template>
  <div class="ss-page" @click="exit" @touchstart.passive="exit">
    <!-- Slideshow -->
    <template v-if="photos.length > 0">
      <Transition name="ss-cross">
        <img
          :key="currentIdx"
          :src="photos[currentIdx].src"
          class="ss-img"
          alt=""
          draggable="false"
        />
      </Transition>

      <!-- Dot indicator -->
      <div v-if="photos.length > 1" class="ss-dots">
        <span
          v-for="(_, i) in photos"
          :key="i"
          class="ss-dot"
          :class="{ active: i === currentIdx }"
        ></span>
      </div>
    </template>

    <!-- No photos configured -->
    <div v-else class="ss-empty">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="6" y="10" width="52" height="40" rx="4"/>
        <circle cx="22" cy="27" r="7"/>
        <path d="M6 46 l16-14 12 12 10-8 14 10"/>
      </svg>
      <p class="ss-empty-title">{{ t('screensaver.noPhotos') }}</p>
      <p class="ss-empty-hint">{{ t('screensaver.noPhotosHint') }}</p>
    </div>

    <!-- Exit hint (fade out after 3s) -->
    <div class="ss-exit-bar" :class="{ hidden: hintHidden }">
      {{ t('screensaver.exit') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useScreensaverStore } from '@/stores/screensaverStore'

const { t } = useI18n()
const router = useRouter()
const ssStore = useScreensaverStore()

const photos = computed(() => ssStore.selected)
const currentIdx = ref(0)
const hintHidden = ref(false)

let slideTimer = null
let hintTimer = null

function exit() {
  router.push('/')
}

onMounted(() => {
  // Auto-hide exit hint after 3s
  hintTimer = setTimeout(() => { hintHidden.value = true }, 3000)

  if (photos.value.length > 1) {
    slideTimer = setInterval(() => {
      currentIdx.value = (currentIdx.value + 1) % photos.value.length
    }, 6000)
  }
})

onUnmounted(() => {
  clearInterval(slideTimer)
  clearTimeout(hintTimer)
})
</script>

<style scoped>
.ss-page {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

/* Slideshow image */
.ss-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Crossfade transition — both enter and leave are absolute so they overlap */
.ss-cross-enter-active,
.ss-cross-leave-active {
  position: absolute;
  inset: 0;
  transition: opacity 1.5s ease-in-out;
}
.ss-cross-enter-from { opacity: 0; }
.ss-cross-leave-to  { opacity: 0; }

/* Dot indicator */
.ss-dots {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}
.ss-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.35);
  transition: background 0.3s, transform 0.3s;
}
.ss-dot.active {
  background: white;
  transform: scale(1.4);
}

/* Empty state */
.ss-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
}
.ss-empty svg {
  width: 80px;
  height: 80px;
  color: rgba(255,255,255,0.2);
}
.ss-empty-title {
  color: rgba(255,255,255,0.7);
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
.ss-empty-hint {
  color: rgba(255,255,255,0.35);
  font-size: 14px;
  text-align: center;
  margin: 0;
  max-width: 280px;
  line-height: 1.6;
}

/* Exit hint bar */
.ss-exit-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 14px;
  text-align: center;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  background: linear-gradient(transparent, rgba(0,0,0,0.5));
  z-index: 20;
  transition: opacity 0.8s ease;
}
.ss-exit-bar.hidden {
  opacity: 0;
  pointer-events: none;
}
</style>
