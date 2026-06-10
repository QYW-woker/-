import { createRouter, createWebHashHistory } from 'vue-router'
import { usePhotoStore } from '@/stores/photoStore'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/camera',
    name: 'camera',
    component: () => import('@/views/CameraView.vue')
  },
  {
    path: '/background',
    name: 'background',
    component: () => import('@/views/BackgroundView.vue'),
    beforeEnter() {
      const store = usePhotoStore()
      if (!store.hasPhoto) return { name: 'camera' }
    }
  },
  {
    path: '/result',
    name: 'result',
    component: () => import('@/views/ResultView.vue'),
    beforeEnter() {
      const store = usePhotoStore()
      if (!store.hasDownloadUrl) return { name: 'camera' }
    }
  },
  {
    path: '/backgrounds',
    name: 'backgrounds',
    component: () => import('@/views/BackgroundLibraryView.vue')
  },
  {
    path: '/album',
    name: 'album',
    component: () => import('@/views/AlbumView.vue')
  },
  {
    path: '/screensaver',
    name: 'screensaver',
    component: () => import('@/views/ScreensaverView.vue')
  },
  {
    path: '/screensaver-settings',
    name: 'screensaver-settings',
    component: () => import('@/views/ScreensaverSettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
