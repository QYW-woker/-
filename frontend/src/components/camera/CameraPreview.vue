<template>
  <div class="camera-preview">
    <video ref="videoRef" autoplay playsinline muted
      :class="{ mirrored: facingMode === 'user' }"
      @loadedmetadata="onVideoReady"
    ></video>
    <div v-if="loading" class="loading-mask">
      <div class="pulse"></div>
      <p>{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
const props = defineProps({
  stream: { type: Object, default: null },
  facingMode: { type: String, default: 'environment' },
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: '' },
})
const emit = defineEmits(['ready'])
const videoRef = ref(null)
watch(() => props.stream, (s) => { if (videoRef.value && s) videoRef.value.srcObject = s }, { immediate: true })
function onVideoReady() { emit('ready', videoRef.value) }
onUnmounted(() => { if (videoRef.value) videoRef.value.srcObject = null })
defineExpose({ videoRef })
</script>

<style scoped>
.camera-preview { position:relative; width:100%; height:100%; background:#000; overflow:hidden; }
video { width:100%; height:100%; object-fit:cover; display:block; }
video.mirrored { transform:scaleX(-1); }
.loading-mask { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; background:#0a0a1a; color:rgba(255,255,255,0.6); font-size:14px; }
.pulse { width:48px; height:48px; border-radius:50%; background:rgba(108,99,255,0.3); animation:pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%,100%{transform:scale(0.8);opacity:.4} 50%{transform:scale(1.1);opacity:.9} }
</style>
