/**
 * Pull image File(s) from a paste or drop event (Win+Shift+S / Ctrl+V screenshots).
 * @param {ClipboardEvent | DragEvent} event
 * @returns {File[]}
 */
export function filesFromClipboardOrDrop(event) {
  const out = []
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

  const dt = event?.clipboardData || event?.dataTransfer
  if (!dt) return out

  const items = dt.items ? [...dt.items] : []
  for (const item of items) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile?.()
    if (!file) continue
    if (!String(file.type || '').startsWith('image/')) continue
    const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
    const name =
      file.name && file.name !== 'image.png' && file.name !== 'blob'
        ? file.name
        : `screenshot-${stamp}.${ext}`
    out.push(new File([file], name, { type: file.type || 'image/png' }))
  }

  if (out.length === 0 && dt.files?.length) {
    for (const file of [...dt.files]) {
      if (!String(file.type || '').startsWith('image/')) continue
      out.push(file)
    }
  }

  return out
}
