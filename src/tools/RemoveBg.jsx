import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { fmtSize, fileToDataUrl, loadImage, blobToDataUrl, triggerDownload, stripExt } from '../utils/helpers'

// Simple flood-fill based background remover (color-based)
function removeBackground(img, tolerance = 30, edgeColor = [255, 255, 255]) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const w = canvas.width, h = canvas.height

  // Sample background color from corners
  const corners = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]
  ]
  const bgColors = corners.map(([x, y]) => {
    const idx = (y * w + x) * 4
    return [data[idx], data[idx + 1], data[idx + 2]]
  })

  const avgBg = bgColors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0])
    .map(v => Math.round(v / bgColors.length))

  function colorDist(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
  }

  // Flood fill from edges
  const visited = new Uint8Array(w * h)
  const queue = []

  // Seed from all edges
  for (let x = 0; x < w; x++) { queue.push(x, 0); queue.push(x, h - 1) }
  for (let y = 1; y < h - 1; y++) { queue.push(0, y); queue.push(w - 1, y) }

  let qi = 0
  while (qi < queue.length) {
    const x = queue[qi++], y = queue[qi++]
    if (x < 0 || x >= w || y < 0 || y >= h) continue
    const idx = y * w + x
    if (visited[idx]) continue
    const pIdx = idx * 4
    const [r, g, b] = [data[pIdx], data[pIdx + 1], data[pIdx + 2]]
    if (colorDist(r, g, b, avgBg[0], avgBg[1], avgBg[2]) > tolerance) continue
    visited[idx] = 1
    data[pIdx + 3] = 0 // transparent
    queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

export default function RemoveBg() {
  const [files, setFiles] = useState([])
  const [tolerance, setTolerance] = useState(35)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState([])

  const addFiles = async (newFiles) => {
    const items = await Promise.all(newFiles.map(async f => ({
      file: f, name: f.name, size: f.size,
      dataUrl: await fileToDataUrl(f)
    })))
    setFiles(prev => [...prev, ...items])
    setResults([])
  }

  const process = async () => {
    setLoading(true); setResults([])
    const out = []

    for (let i = 0; i < files.length; i++) {
      setStatus(`Processing ${i + 1} of ${files.length}…`)
      const item = files[i]
      const img = await loadImage(item.dataUrl)

      const canvas = removeBackground(img, tolerance)
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'))
      const dataUrl = await blobToDataUrl(blob)
      out.push({ dataUrl, blob, name: stripExt(item.name) + '_nobg.png', origSize: item.size, newSize: blob.size })
    }

    setResults(out); setStatus('Done!'); setLoading(false)
  }

  return (
    <div>
      <div className="tool-header">
        <h2 className="tool-page-title">✂️ Remove Background</h2>
        <p className="tool-page-desc">Automatically removes solid or near-solid backgrounds using edge-fill detection. Best on images with uniform backgrounds.</p>
      </div>

      <div className="card" style={{ marginBottom: 16, background: 'var(--warning-light)', borderColor: 'rgba(217,119,6,0.2)' }}>
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 13, color: 'var(--warning)', display: 'flex', gap: 8 }}>
            <span>⚠️</span>
            <span>Works best on images with a plain or solid background (white, solid color, sky). For complex scenes, use a dedicated AI tool like remove.bg</span>
          </div>
        </div>
      </div>

      <Dropzone onFiles={addFiles} accept="image/*" multiple label="Drop images here" sublabel="PNG output with transparent background" />

      {files.length > 0 && (
        <>
          <div className="card" style={{ margin: '20px 0' }}>
            <div className="card-header">
              <span className="card-title">{files.length} file{files.length > 1 ? 's' : ''}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setFiles([]); setResults([]) }}>Clear</button>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {files.map((f, i) => (
                <div key={i} className="file-row">
                  <img className="file-thumb" src={f.dataUrl} alt={f.name} style={{ background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 8px 8px' }} />
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-meta">{fmtSize(f.size)}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setFiles(p => p.filter((_, idx) => idx !== i))} style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Options</span></div>
            <div className="card-body">
              <div className="control-group">
                <div className="control-label">Color Tolerance — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>{tolerance}</span></div>
                <div className="slider-row">
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Precise</span>
                  <input type="range" min="5" max="100" value={tolerance} onChange={e => setTolerance(+e.target.value)} />
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Aggressive</span>
                </div>
                <div className="control-hint">Higher tolerance removes more background but may affect subject</div>
              </div>
            </div>
          </div>

          {loading && <div className="status-text">{status}</div>}
          <button className="btn btn-primary btn-lg btn-full" onClick={process} disabled={loading}>
            {loading ? '⏳ Processing…' : '✂️ Remove Background'}
          </button>

          {results.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <span className="card-title">✅ Results</span>
                {results.length > 1 && (
                  <button className="btn btn-outline btn-sm" onClick={() => results.forEach((r, i) => setTimeout(() => triggerDownload(r.dataUrl, r.name), i * 300))}>
                    ⬇ Download All
                  </button>
                )}
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {results.map((r, i) => (
                  <div key={i} className="file-row">
                    <img className="file-thumb" src={r.dataUrl} alt={r.name}
                      style={{ background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 8px 8px' }} />
                    <div className="file-info">
                      <div className="file-name">{r.name}</div>
                      <div className="file-meta">PNG with transparency · {fmtSize(r.newSize)}</div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => triggerDownload(r.dataUrl, r.name)}>⬇</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
