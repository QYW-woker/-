<template>
  <div class="controls">
    <button class="ctrl-btn" @click="emit('toggle')" :disabled="disabled" :title="switchTitle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 4v6h6M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
    </button>
    <button class="shutter-btn" @click="emit('capture')" :disabled="disabled">
      <span class="shutter-inner"></span>
    </button>
    <div class="ctrl-btn placeholder"></div>
  </div>
</template>
<script setup>
defineProps({ disabled: { type: Boolean, default: false }, switchTitle: { type: String, default: '' } })
const emit = defineEmits(['capture', 'toggle'])
</script>
<style scoped>
.controls { display:flex; align-items:center; justify-content:space-between; padding:0 40px; width:100%; }
.ctrl-btn { width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; color:white; backdrop-filter:blur(8px); transition:background 0.2s; }
.ctrl-btn:active { background:rgba(255,255,255,0.25); }
.ctrl-btn svg { width:22px; height:22px; }
.ctrl-btn:disabled { opacity:0.3; }
.placeholder { pointer-events:none; background:transparent; }
.shutter-btn { width:76px; height:76px; border-radius:50%; background:rgba(255,255,255,0.9); display:flex; align-items:center; justify-content:center; border:4px solid rgba(255,255,255,0.5); transition:transform 0.15s,background 0.15s; box-shadow:0 0 0 2px rgba(255,255,255,0.3); }
.shutter-btn:active { transform:scale(0.92); background:white; }
.shutter-btn:disabled { opacity:0.4; }
.shutter-inner { width:58px; height:58px; border-radius:50%; background:white; border:2px solid rgba(0,0,0,0.1); }
</style>
