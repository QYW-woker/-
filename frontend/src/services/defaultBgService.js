/**
 * 默认背景管理（localStorage）
 * 管理员在背景库中最多选 3 张背景作为"默认"，
 * 用户拍照后自动合成这些背景并直接展示结果，跳过手动选择步骤。
 */

const KEY = 'photo_default_bgs'
export const MAX_DEFAULTS = 3

/**
 * 获取所有默认背景
 * @returns {{ id, src, thumbnail }[]}
 */
export function getDefaultBgs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_DEFAULTS)))
}

/**
 * 切换一张背景的默认状态
 * 未选中 → 选中（若未达上限）；已选中 → 取消
 * @returns {{ id, src, thumbnail }[]} 更新后的列表
 */
export function toggleDefaultBg(bg) {
  const list = getDefaultBgs()
  const idx = list.findIndex(d => d.id === bg.id)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else if (list.length < MAX_DEFAULTS) {
    list.push({ id: bg.id, src: bg.src, thumbnail: bg.thumbnail })
  }
  persist(list)
  return [...list]
}

/**
 * 判断某背景是否已被设为默认
 * @param {string} id
 * @returns {boolean}
 */
export function isDefaultBg(id) {
  return getDefaultBgs().some(d => d.id === id)
}

/**
 * 删除背景时同步从默认列表中移除
 * @param {string} id
 * @returns {{ id, src, thumbnail }[]}
 */
export function removeFromDefaults(id) {
  const list = getDefaultBgs().filter(d => d.id !== id)
  persist(list)
  return [...list]
}
