export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function generateId(prefix, year) {
  const items = JSON.parse(localStorage.getItem(prefix) || '[]')
  const maxNum = items.reduce((max, item) => {
    const match = item.id.match(new RegExp(`${prefix}-${year}-(\\d+)`))
    if (match) {
      const num = parseInt(match[1], 10)
      return num > max ? num : max
    }
    return max
  }, 0)
  const nextNum = String(maxNum + 1).padStart(3, '0')
  return `${prefix}-${year}-${nextNum}`
}
