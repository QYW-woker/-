<template>
  <div
    class="home-page"
    :class="{ 'is-wide': isWide }"
    @click="resetIdle"
    @touchstart.passive="resetIdle"
    @mousemove="resetIdle"
    @keydown.passive="resetIdle"
  >
    <div class="top-bar">
      <!-- Screensaver settings button -->
      <button class="ss-btn" :title="t('screensaver.settings')" @click.stop="router.push('/screensaver-settings')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="2" y="4" width="20" height="14" rx="2"/>
          <path d="M8 20h8M12 18v2"/>
          <circle cx="9" cy="11" r="2.5"/>
          <path d="M14 9h4M14 13h4"/>
        </svg>
        <span
          v-if="ssStore.selected.length > 0"
          class="ss-dot-badge"
        ></span>
      </button>
      <LanguageSwitcher />
    </div>

    <div class="hero">
      <h1 class="hero-title">{{ t('home.title') }}</h1>
      <p class="hero-sub">{{ t('home.tagline') }}</p>
    </div>

    <div class="nav-grid">
      <!-- 相册 (左) -->
      <div class="nav-card secondary" @click.stop="router.push('/album')">
        <div class="nav-icon">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="8" width="40" height="32" rx="4"/>
            <circle cx="15" cy="20" r="5"/>
            <path d="M4 36 l12-10 10 10 8-6 10 8"/>
          </svg>
        </div>
        <div class="nav-label">{{ t('home.album') }}</div>
        <div class="nav-desc">{{ t('home.albumDesc') }}</div>
      </div>

      <!-- 拍照 (中/主) -->
      <div class="nav-card primary" @click.stop="router.push('/camera')">
        <div class="camera-glow"></div>
        <div class="nav-icon camera-icon-wrap">
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 18h52v38H6z" rx="4"/>
            <path d="M22 18l4-8h12l4 8"/>
            <circle cx="32" cy="37" r="11"/>
            <circle cx="32" cy="37" r="7"/>
            <circle cx="47" cy="25" r="2" fill="currentColor"/>
          </svg>
        </div>
        <div class="nav-label">{{ t('home.camera') }}</div>
        <div class="nav-desc">{{ t('home.cameraDesc') }}</div>
        <div class="start-badge">TAP</div>
      </div>

      <!-- 背景库 (右) -->
      <div class="nav-card secondary" @click.stop="router.push('/backgrounds')">
        <div class="nav-icon">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="4" width="19" height="19" rx="3"/>
            <rect x="25" y="4" width="19" height="19" rx="3"/>
            <rect x="4" y="25" width="19" height="19" rx="3"/>
            <rect x="25" y="25" width="19" height="19" rx="3"/>
          </svg>
        </div>
        <div class="nav-label">{{ t('home.backgrounds') }}</div>
        <div class="nav-desc">{{ t('home.backgroundsDesc') }}</div>
      </div>
    </div>

    <!-- Idle countdown hint (shows when < 15s left) -->
    <Transition name="idle-hint">
      <div v-if="idleCountdown > 0 && idleCountdown <= 15" class="idle-hint">
        {{ t('screensaver.idleHint', { n: idleCountdown }) }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { useScreensaverStore } from '@/stores/screensaverStore'

const { t } = useI18n()
const router = useRouter()
const ssStore = useScreensaverStore()

// 宽屏检测：双屏或宽比例窗口 (aspect > 2:1)
const isWide = computed(() => window.innerWidth / window.innerHeight >= 2)

// ── Idle screensaver timer ─────────────────
const IDLE_TIMEOUT = 60  // seconds
const idleCountdown = ref(0)
let idleTimer = null
let countdownInterval = null

function resetIdle() {
  idleCountdown.value = 0
  clearTimeout(idleTimer)
  clearInterval(countdownInterval)

  idleTimer = setTimeout(() => {
    router.push('/screensaver')
  }, IDLE_TIMEOUT * 1000)

  // Show countdown in the last 15s
  const countdownStart = (IDLE_TIMEOUT - 15) * 1000
  setTimeout(() => {
    idleCountdown.value = 15
    countdownInterval = setInterval(() => {
      idleCountdown.value--
      if (idleCountdown.value <= 0) clearInterval(countdownInterval)
    }, 1000)
  }, countdownStart)
}

const EVENTS = ['click', 'touchstart', 'mousemove', 'keydown']

onMounted(() => {
  EVENTS.forEach(e => window.addEventListener(e, resetIdle, { passive: true }))
  resetIdle()
})

onUnmounted(() => {
  clearTimeout(idleTimer)
  clearInterval(countdownInterval)
  EVENTS.forEach(e => window.removeEventListener(e, resetIdle))
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: radial-gradient(ellipse at 50% 40%, #1a1040 0%, #0a0a1a 70%);
  overflow: hidden;
  position: relative;
}

/* ── Top bar ─────────────────────────────── */
.top-bar {
  position: absolute;
  top: calc(16px + var(--safe-top, 0px));
  right: 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Screensaver settings button */
.ss-btn {
  position: relative;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.6);
  transition: background 0.2s, color 0.2s;
}
.ss-btn:hover { background: rgba(255,255,255,0.12); color: white; }
.ss-btn svg { width: 18px; height: 18px; }
.ss-dot-badge {
  position: absolute;
  top: 6px; right: 6px;
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #6c63ff;
  border: 1.5px solid #0a0a1a;
}

/* ── Hero ────────────────────────────────── */
.hero {
  flex-shrink: 0;
  text-align: center;
  padding: calc(48px + var(--safe-top, 0px)) 24px 0;
}
.hero-title {
  font-size: clamp(24px, 4vw, 52px);
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
}
.hero-sub {
  font-size: clamp(13px, 1.5vw, 18px);
  color: rgba(255,255,255,0.45);
  margin: 0;
}

/* ── Nav grid ────────────────────────────── */
.nav-grid {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 3vw, 60px);
  padding: 24px clamp(16px, 4vw, 80px) calc(24px + var(--safe-bottom, 0px));
}

/* ── Cards ───────────────────────────────── */
.nav-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 24px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.nav-card:active { transform: scale(0.96); }

.secondary {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  width: clamp(120px, 20vw, 260px);
  height: clamp(160px, 26vw, 320px);
}
.secondary:hover {
  background: rgba(255,255,255,0.1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.primary {
  background: linear-gradient(145deg, #6c63ff 0%, #4a42d4 100%);
  border: none;
  width: clamp(160px, 28vw, 340px);
  height: clamp(200px, 34vw, 420px);
  box-shadow: 0 16px 64px rgba(108,99,255,0.4);
}
.primary:hover {
  box-shadow: 0 24px 80px rgba(108,99,255,0.55);
  transform: translateY(-4px);
}
.primary:active { transform: scale(0.96) translateY(0); }

.camera-glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle, rgba(108,99,255,0.35) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
  pointer-events: none;
}
@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* ── Icon ────────────────────────────────── */
.nav-icon { color: rgba(255,255,255,0.85); }
.nav-icon svg { width: clamp(40px, 6vw, 72px); height: clamp(40px, 6vw, 72px); }
.camera-icon-wrap svg { width: clamp(52px, 8vw, 96px); height: clamp(52px, 8vw, 96px); color: #fff; }

/* ── Labels ──────────────────────────────── */
.nav-label { font-size: clamp(14px, 2vw, 20px); font-weight: 700; color: #fff; letter-spacing: 0.02em; }
.nav-desc { font-size: clamp(11px, 1.2vw, 14px); color: rgba(255,255,255,0.5); text-align: center; padding: 0 12px; }
.start-badge {
  position: absolute;
  bottom: 16px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.15em;
  color: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 12px; padding: 3px 10px;
}

/* ── Idle hint ───────────────────────────── */
.idle-hint {
  position: absolute;
  bottom: calc(12px + var(--safe-bottom, 0px));
  left: 50%; transform: translateX(-50%);
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  white-space: nowrap;
  pointer-events: none;
}
.idle-hint-enter-active, .idle-hint-leave-active { transition: opacity 0.5s; }
.idle-hint-enter-from, .idle-hint-leave-to { opacity: 0; }

/* ── Wide screen (32:9 dual screen) ─────── */
.is-wide .hero { padding-top: calc(20px + var(--safe-top, 0px)); }
.is-wide .hero-title { font-size: 36px; }
.is-wide .hero-sub { font-size: 14px; }
.is-wide .nav-grid { gap: 80px; }
.is-wide .secondary { width: 280px; height: 340px; }
.is-wide .primary { width: 360px; height: 440px; }

/* ── Mobile portrait ─────────────────────── */
@media (max-width: 600px) {
  .nav-grid {
    flex-direction: column;
    gap: 16px;
    padding: 16px 24px calc(24px + var(--safe-bottom, 0px));
  }
  .secondary { width: 100%; height: 90px; flex-direction: row; border-radius: 16px; gap: 16px; padding: 0 24px; }
  .primary { width: 100%; height: 120px; flex-direction: row; border-radius: 20px; gap: 16px; padding: 0 24px; }
  .nav-icon svg { width: 36px; height: 36px; }
  .camera-icon-wrap svg { width: 44px; height: 44px; }
  .nav-label { font-size: 16px; }
  .nav-desc { display: none; }
  .start-badge { bottom: auto; right: 20px; }
  .camera-glow { display: none; }
}
</style>
