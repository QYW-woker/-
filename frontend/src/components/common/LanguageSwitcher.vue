<template>
  <div class="lang-switcher" ref="rootRef">
    <button class="lang-btn" @click="open = !open">
      <span class="lang-short">{{ currentLocale.short }}</span>
      <svg class="chevron" :class="{ up: open }" viewBox="0 0 10 6" fill="none">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="open" class="lang-menu">
        <button
          v-for="loc in locales"
          :key="loc.code"
          class="lang-option"
          :class="{ active: loc.code === locale }"
          @click="select(loc.code)"
        >
          {{ loc.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOCALES, setLocale } from '@/i18n'

const { locale } = useI18n()
const open = ref(false)
const rootRef = ref(null)

const locales = LOCALES
const currentLocale = computed(() => locales.find(l => l.code === locale.value) || locales[0])

function select(code) {
  setLocale(code)
  open.value = false
}

function onClickOutside(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside, true))
onUnmounted(() => document.removeEventListener('click', onClickOutside, true))
</script>

<style scoped>
.lang-switcher {
  position: relative;
}
.lang-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 20px;
  background: rgba(108,99,255,0.25);
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}
.lang-btn:active { background: rgba(108,99,255,0.4); }
.lang-short { letter-spacing: 0.3px; }
.chevron { width: 10px; height: 6px; transition: transform 0.2s; }
.chevron.up { transform: rotate(180deg); }

.lang-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background-color: #F4F6FA !important;
  background: #F4F6FA !important;
  border: 1px solid rgba(108,99,255,0.4);
  border-radius: 12px;
  overflow: hidden;
  min-width: 140px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.7);
  z-index: 100;
  -webkit-font-smoothing: antialiased;
  isolation: isolate;
}
.lang-option {
  display: block;
  width: 100%;
  padding: 12px 18px;
  text-align: left;
  color: #6b7499;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
}
.lang-option:hover { background: rgba(108,99,255,0.1); color: #4a4fcc; }
.lang-option.active { color: #6c63ff; font-weight: 700; background: rgba(108,99,255,0.12); }

.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0; transform: translateY(-6px);
}
</style>
