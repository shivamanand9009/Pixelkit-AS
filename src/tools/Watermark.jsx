import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { fmtSize, fileToDataUrl, loadImage, canvasToBlob, blobToDataUrl, triggerDownload, stripExt } from '../utils/helpers'

const POSITIONS = [
  ['top-left','↖ Top Left'], ['top-center','↑ Top Center'], ['top-right','↗ Top Right'],
  ['center-left','← Center Left'], ['center','⊕ Center'], ['center-right','→ Center Right'],
  ['bottom-left','↙ Bottom Left'], ['bottom-center','↓ Bottom Center'], ['bottom-right','↘ Bottom Right'],
]

function drawWatermark(img, opts) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  const { text, fontSize, opacity, color, position, rotation } = opts
  const margin = Math.round(img.naturalWidth * 0.04)
  const fs = Math.round(img.naturalWidth * (fontSize / 1000))

  ctx.save()
  ctx.globalAlpha = opacity / 100
  ctx.font = `bold ${fs}px DM Sans, sans-serif`
  ctx.fillStyle = color

  const tw = ctx.measureText(text).width
  const th = fs

  let x = 0, y = 0
  const [vy, vx] = position.split('-')
  if (vx === 'left') x = margin
  else if (vx === 'center' || !vx) x = (canvas.width - tw) / 2
  else x = canvas.width - tw - margin

  if (vy === 'top') y = margin + th
  else if (vy === 'center') y = (canvas.height + th) / 2
  else y = canvas.height - margin

  ctx.translate(x + tw / 2, y - th / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.fillText(text, -tw / 2, th / 2)
  ctx.restore()

  return canvas
}

export default function Watermark() {
  const [files, setFiles] = useState([])
  const [text, setText] = useState('© My Brand')
  const [fontSize, setFontSize] = useState(40)
  const [opacity, setOpacity] = useState(50)
  const [color, setColor] = useState('#ffffff')
  const [position, setPosition] = useState('bottom-right')
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState([])
  const [preview, setPreview] = useState(null)

  const addFiles = async (newFiles) => {
    const items = await Promise.all(newFiles.map(async f => ({
      file: f, name: f.name, size: f.size,
      dataUrl: await fileToDataUrl(f)
    })))
    setFiles(prev => [...prev, ...items])
    setResults([])
    if (items.length) updatePreview(items[0].dataUrl)
  }

  const updatePreview = async (dataUrl) => {
    const img = await loadImage(dataUrl)
    const canvas = drawWatermark(img, { text, fontSize, opacity, color, position, rotation })
    setPreview(canvas.toDataURL('image/jpeg', 0.8))
  }

  const handlePreviewUpdate = async () => {
    if (!files.length) return
    await updatePreview(files[0].dataUrl)
  }

  const process = async () => {
    setLoading(true); setResults([])
    const out = []

    for (let i = 0; i < files.length; i++) {
      setStatus(`Watermarking ${i + 1} of ${files.length}…`)
      const item = files[i]
      const img = await loadImage(item.dataUrl)
      const canvas = drawWatermark(img, { text, fontSize, opacity, color, position, rotation })
      const blob = await canvasToBlob(canvas, 'jpeg', 92)
      const dataUrl = await blobToDataUrl(blob)
      out.push({ dataUrl, blob, name: stripExt(item.name) + '_watermarked.jpg', origSize: item.size, newSize: blob.size })
    }

    setResults(out); setStatus('Done!'); setLoading(false)
  }

  return (
    <div>
      <div className="tool-header">
        <h2 className="tool-page-title">💧 Add Watermark</h2>
        <p className="tool-page-desc">Stamp text watermarks on your images with custom position, size, and opacity.</p>
      </div>

      <Dropzone onFiles={addFiles} accept="image/*" multiple label="Drop images to watermark" />

      {files.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '20px 0' }}>
            {/* Options */}
            <div className="card">
              <div className="card-header"><span className="card-title">Watermark Options</span></div>
              <div className="card-body">
                <div className="controls-section">
                  <div className="control-group">
                    <div className="control-label">Text</div>
                    <input type="text" value={text} onChange={e => { setText(e.target.value) }} onBlur={handlePreviewUpdate} style={{ width: '100%' }} maxLength={60} />
                  </div>
                  <div className="control-group">
                    <div className="control-label">Font Size — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>{fontSize}</span></div>
                    <div className="slider-row">
                      <input type="range" min="10" max="100" value={fontSize} onChange={e => setFontSize(+e.target.value)} onMouseUp={handlePreviewUpdate} />
                    </div>
                  </div>
                  <div className="control-group">
                    <div className="control-label">Opacity — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>{opacity}%</span></div>
                    <div className="slider-row">
                      <input type="range" min="5" max="100" value={opacity} onChange={e => setOpacity(+e.target.value)} onMouseUp={handlePreviewUpdate} />
                    </div>
                  </div>
                  <div className="control-group">
                    <div className="control-label">Rotation — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>{rotation}°</span></div>
                    <div className="slider-row">
                      <input type="range" min="-180" max="180" value={rotation} onChange={e => setRotation(+e.target.value)} onMouseUp={handlePreviewUpdate} />
                    </div>
                  </div>
                  <div className="control-group">
                    <div className="control-label">Color</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" value={color} onChange={e => setColor(e.target.value)} onBlur={handlePreviewUpdate}
                        style={{ width: 40, height: 32, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 2 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)' }}>{color}</span>
                      {['#ffffff','#000000','#ff0000','#ffcc00'].map(c => (
                        <div key={c} onClick={() => { setColor(c); setTimeout(handlePreviewUpdate, 50) }}
                          style={{ width: 22, height: 22, borderRadius: 4, background: c, border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }} />
                      ))}
                    </div>
                  </div>
                  <div className="control-group">
                    <div className="control-label">Position</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                      {POSITIONS.map(([val, label]) => (
                        <div key={val} className={`pill ${position === val ? 'selected' : ''}`}
                          style={{ textAlign: 'center', fontSize: 11, padding: '5px 8px' }}
                          onClick={() => { setPosition(val); setTimeout(handlePreviewUpdate, 50) }}>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="card">
              <div className="card-header"><span className="card-title">Preview</span></div>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid var(--border)' }} />
                ) : (
                  <div style={{ color: 'var(--text-3)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                    Preview will appear here
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && <div className="status-text">{status}</div>}
          <button className="btn btn-primary btn-lg btn-full" onClick={process} disabled={loading || !text.trim()}>
            {loading ? '⏳ Processing…' : '💧 Apply Watermark'}
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
                    <img className="file-thumb" src={r.dataUrl} alt={r.name} />
                    <div className="file-info">
                      <div className="file-name">{r.name}</div>
                      <div className="file-meta">{fmtSize(r.newSize)}</div>
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
