import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'ss_photos'

export const useScreensaverStore = defineStore('screensaver', () => {
  const selected = ref(
    JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  )

  watch(selected, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function togglePhoto(photo) {
    const idx = selected.value.findIndex(p => p.id === photo.id)
    if (idx >= 0) {
      selected.value.splice(idx, 1)
    } else {
      selected.value.push({ id: photo.id, src: photo.src })
    }
  }

  function isSelected(id) {
    return selected.value.some(p => p.id === id)
  }

  function clearAll() {
    selected.value = []
  }

  return { selected, togglePhoto, isSelected, clearAll }
})
