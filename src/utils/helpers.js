export function fmtSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

export function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

export function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export function canvasToBlob(canvas, fmt = 'jpeg', quality = 90) {
  return new Promise(res => {
    const mime = fmt === 'png' ? 'image/png' : fmt === 'webp' ? 'image/webp' : 'image/jpeg'
    canvas.toBlob(res, mime, quality / 100)
  })
}

export function blobToDataUrl(blob) {
  return new Promise(res => {
    const r = new FileReader()
    r.onload = e => res(e.target.result)
    r.readAsDataURL(blob)
  })
}

export function triggerDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export function stripExt(name) {
  return name.replace(/\.[^.]+$/, '')
}
