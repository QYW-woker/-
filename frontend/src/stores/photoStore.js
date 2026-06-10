import { defineStore } from 'pinia'
import { markRaw } from 'vue'

// 模块级变量：存储进行中的预分割 Promise（非响应式，不可序列化）
let _segmentPromise = null

export const usePhotoStore = defineStore('photo', {
  state: () => ({
    photoDataUrl: null,          // 拍摄的原始照片 base64
    selectedBackground: null,    // { id, name, src, thumbnail, color }
    compositeDataUrl: null,      // 合成后的图片 base64
    uploadedImageId: null,       // 后端返回的 UUID
    downloadUrl: null,           // 后端图片完整访问 URL
    isSegmenting: false,         // 当前页面 AI 处理中（显示 loading）
    isUploading: false,          // 上传中
    segmentError: null,
    uploadError: null,
    facingMode: 'environment',   // 'user' 前置 | 'environment' 后置

    // 预分割：拍完照立即开始，不等进入背景页
    segmentedPerson: null,       // HTMLImageElement（markRaw），remove.bg 透明人像结果
    isPreSegmenting: false,      // 预分割进行中
    preSegmentError: null,       // 预分割错误信息
  }),

  getters: {
    hasPhoto: (state) => !!state.photoDataUrl,
    hasComposite: (state) => !!state.compositeDataUrl,
    hasDownloadUrl: (state) => !!state.downloadUrl
  },

  actions: {
    setPhoto(dataUrl) {
      this.photoDataUrl = dataUrl
      this.compositeDataUrl = null
      this.uploadedImageId = null
      this.downloadUrl = null
      this.selectedBackground = null
      this.segmentError = null
      this.uploadError = null
      // 清除上一张照片的预分割状态
      this.segmentedPerson = null
      this.isPreSegmenting = false
      this.preSegmentError = null
      _segmentPromise = null
    },
    selectBackground(bg) {
      this.selectedBackground = bg
    },
    setComposite(dataUrl) {
      this.compositeDataUrl = dataUrl
    },
    setUploadResult({ id, url }) {
      this.uploadedImageId = id
      this.downloadUrl = url
    },
    toggleCamera() {
      this.facingMode = this.facingMode === 'user' ? 'environment' : 'user'
    },
    resetAll() {
      this.photoDataUrl = null
      this.selectedBackground = null
      this.compositeDataUrl = null
      this.uploadedImageId = null
      this.downloadUrl = null
      this.isSegmenting = false
      this.isUploading = false
      this.segmentError = null
      this.uploadError = null
      this.segmentedPerson = null
      this.isPreSegmenting = false
      this.preSegmentError = null
      _segmentPromise = null
    },

    // ── 预分割相关 ──────────────────────────────────────────
    // 在 CameraView confirm() 时调用，后台开始分割
    beginPreSegment(promise) {
      _segmentPromise = promise
      this.isPreSegmenting = true
      this.preSegmentError = null
      this.segmentedPerson = null
    },
    // 分割成功
    resolvePreSegment(img) {
      if (!this.isPreSegmenting) return  // setPhoto 已清除（用户重拍），忽略旧结果
      this.segmentedPerson = markRaw(img)
      this.isPreSegmenting = false
      _segmentPromise = null
    },
    // 分割失败
    rejectPreSegment(msg) {
      if (!this.isPreSegmenting) return
      this.preSegmentError = msg
      this.isPreSegmenting = false
      _segmentPromise = null
    },
    // 返回进行中的 Promise（BackgroundView 用来等待结果）
    awaitPreSegment() {
      return _segmentPromise
    },
  }
})
