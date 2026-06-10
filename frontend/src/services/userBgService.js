import axios from 'axios'

export async function listUserBgs() {
  const res = await axios.get('/api/user-background/list')
  return res.data.backgrounds || []
}

export async function uploadUserBg(file) {
  const fd = new FormData()
  fd.append('image', file)
  const res = await axios.post('/api/user-background/upload', fd)
  if (!res.data.success) throw new Error(res.data.message || 'Upload failed')
  return res.data
}

export async function deleteUserBg(id) {
  await axios.delete(`/api/user-background/${encodeURIComponent(id)}`)
}
