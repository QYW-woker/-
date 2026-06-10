import { ref } from 'vue'
import { i18n } from '@/i18n'

const _t = (key) => i18n.global.t(key)

export function useCamera() {
  const stream = ref(null)
  const error = ref(null)
  const isLoading = ref(false)

  async function startCamera(facingMode = 'environment') {
    error.value = null
    isLoading.value = true
    stopCamera()

    // 非安全上下文（HTTP 局域网访问）时，navigator.mediaDevices 不存在
    if (!navigator.mediaDevices?.getUserMedia) {
      error.value = _t('error.httpsRequired')
      isLoading.value = false
      return null
    }

    const constraints = {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }

    try {
      stream.value = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        error.value = _t('error.cameraPermission')
      } else if (err.name === 'NotFoundError') {
        error.value = _t('error.noCamera')
      } else {
        error.value = _t('error.cameraFailed') + err.message
      }
    } finally {
      isLoading.value = false
    }
    return stream.value
  }

  function stopCamera() {
    if (stream.value) {
      stream.value.getTracks().forEach(t => t.stop())
      stream.value = null
    }
  }

  function takePhoto(videoEl) {
    const canvas = document.createElement('canvas')
    const w = videoEl.videoWidth
    const h = videoEl.videoHeight
    const scale = Math.min(1, 1280 / Math.max(w, h))
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  return { stream, error, isLoading, startCamera, stopCamera, takePhoto }
}
