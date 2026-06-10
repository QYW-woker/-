import axios from 'axios'

export async function listBgs() {
  const res = await axios.get('/api/backgrounds/list')
  return res.data.backgrounds || []
}

export async function uploadBg(file) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await axios.post('/api/backgrounds/upload', fd)
  if (!res.data.success) throw new Error(res.data.message || 'Upload failed')
  return res.data
}

export async function deleteBg(id) {
  await axios.delete(`/api/backgrounds/${encodeURIComponent(id)}`)
}
