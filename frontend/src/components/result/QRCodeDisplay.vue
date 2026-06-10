<template>
  <div class="qr-wrapper">
    <div class="qr-box">
      <QrcodeVue
        :value="url"
        :size="qrSize"
        level="H"
        :margin="2"
        render-as="svg"
        foreground="#1a1a2e"
        background="#ffffff"
      />
    </div>
    <p class="qr-hint">{{ t('result.scanToSave') }}</p>
    <p class="qr-sub">{{ t('result.expiry') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import QrcodeVue from 'qrcode-vue3'

const { t } = useI18n()

defineProps({
  url: { type: String, required: true },
  qrSize: { type: Number, default: 200 }
})
</script>

<style scoped>
.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.qr-box {
  padding: 12px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}
.qr-hint {
  color: white;
  font-size: 16px;
  font-weight: 600;
}
.qr-sub {
  color: rgba(255,255,255,0.45);
  font-size: 12px;
}
</style>
