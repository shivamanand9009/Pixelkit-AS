import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { fmtSize, fileToDataUrl, loadImage, canvasToBlob, blobToDataUrl, triggerDownload, stripExt } from '../utils/helpers'

export default function Resize() {
  const [files, setFiles] = useState([])
  const [mode, setMode] = useState('px') // px | pct | target
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockRatio, setLockRatio] = useState(true)
  const [scale, setScale] = useState(50)
  const [targetKb, setTargetKb] = useState(200)
  const [format, setFormat] = useState('jpeg')
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

  const handleWidthChange = async (val) => {
    setWidth(val)
    if (lockRatio && val && files.length) {
      const img = await loadImage(files[0].dataUrl)
      setHeight(Math.round(img.naturalHeight * val / img.naturalWidth))
    }
  }

  const handleHeightChange = async (val) => {
    setHeight(val)
    if (lockRatio && val && files.length) {
      const img = await loadImage(files[0].dataUrl)
      setWidth(Math.round(img.naturalWidth * val / img.naturalHeight))
    }
  }

  const resize = async () => {
    setLoading(true); setResults([])
    const out = []

    for (let i = 0; i < files.length; i++) {
      setStatus(`Resizing ${i + 1} of ${files.length}…`)
      const item = files[i]
      const img = await loadImage(item.dataUrl)
      const srcW = img.naturalWidth, srcH = img.naturalHeight
      let tw = srcW, th = srcH, blob

      if (mode === 'px') {
        const wv = parseInt(width), hv = parseInt(height)
        if (wv && hv) { tw = wv; th = hv }
        else if (wv) { tw = wv; th = lockRatio ? Math.round(srcH * wv / srcW) : srcH }
        else if (hv) { th = hv; tw = lockRatio ? Math.round(srcW * hv / srcH) : srcW }
      } else if (mode === 'pct') {
        const f = scale / 100
        tw = Math.round(srcW * f); th = Math.round(srcH * f)
      } else if (mode === 'target') {
        const targetBytes = targetKb * 1024
        const canvas = document.createElement('canvas')
        canvas.width = srcW; canvas.height = srcH
        canvas.getContext('2d').drawImage(img, 0, 0)
        let lo = 5, hi = 95, bestBlob = null
        for (let iter = 0; iter < 12; iter++) {
          const mid = Math.round((lo + hi) / 2)
          const b = await canvasToBlob(canvas, format === 'png' ? 'jpeg' : format, mid)
          bestBlob = b
          if (Math.abs(b.size - targetBytes) < targetBytes * 0.03) break
          if (b.size > targetBytes) hi = mid - 1
          else lo = mid + 1
        }
        blob = bestBlob
      }

      if (!blob) {
        const canvas = document.createElement('canvas')
        canvas.width = tw; canvas.height = th
        canvas.getContext('2d').drawImage(img, 0, 0, tw, th)
        blob = await canvasToBlob(canvas, format, 92)
      }

      const dataUrl = await blobToDataUrl(blob)
      const ext = format === 'jpeg' ? 'jpg' : format
      const outImg = await loadImage(dataUrl)
      out.push({
        dataUrl, blob, name: stripExt(item.name) + '_resized.' + ext,
        origSize: item.size, newSize: blob.size,
        origDim: `${srcW}×${srcH}`, newDim: `${outImg.naturalWidth}×${outImg.naturalHeight}`
      })
    }

    setResults(out); setStatus('Done!'); setLoading(false)
  }

  return (
    <div>
      <div className="tool-header">
        <h2 className="tool-page-title">📐 Resize Image</h2>
        <p className="tool-page-desc">Scale images by exact pixels, percentage, or target file size.</p>
      </div>

      <Dropzone onFiles={addFiles} accept="image/*" multiple label="Drop images to resize" />

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
                  <img className="file-thumb" src={f.dataUrl} alt={f.name} />
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-meta">{fmtSize(f.size)}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Resize Mode</span></div>
            <div className="card-body">
              <div className="pill-group" style={{ marginBottom: 20 }}>
                {[['px','By Pixels'],['pct','By Percent'],['target','Target Size (KB)']].map(([val,label]) => (
                  <div key={val} className={`pill ${mode === val ? 'selected' : ''}`} onClick={() => setMode(val)}>{label}</div>
                ))}
              </div>

              {mode === 'px' && (
                <div className="controls-section">
                  <div className="control-group">
                    <div className="control-label">Dimensions</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="number" value={width} onChange={e => handleWidthChange(e.target.value)} placeholder="Width" min="1" max="20000" style={{ width: 110 }} />
                      <span style={{ color: 'var(--text-3)' }}>×</span>
                      <input type="number" value={height} onChange={e => handleHeightChange(e.target.value)} placeholder="Height" min="1" max="20000" style={{ width: 110 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>px</span>
                    </div>
                  </div>
                  <div className="control-group">
                    <div className="toggle-row">
                      <div>
                        <div className="control-label">Lock Aspect Ratio</div>
                        <div className="control-hint">Maintain proportions when resizing</div>
                      </div>
                      <div className={`toggle ${lockRatio ? 'on' : ''}`} onClick={() => setLockRatio(!lockRatio)} />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'pct' && (
                <div className="controls-section">
                  <div className="control-group">
                    <div className="control-label">Scale — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>{scale}%</span></div>
                    <div className="slider-row">
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>5%</span>
                      <input type="range" min="5" max="400" value={scale} onChange={e => setScale(+e.target.value)} />
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>400%</span>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'target' && (
                <div className="controls-section">
                  <div className="control-group">
                    <div className="control-label">Target File Size</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="number" value={targetKb} onChange={e => setTargetKb(+e.target.value)} min="5" max="10000" style={{ width: 120 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>KB</span>
                    </div>
                    <div className="control-hint">Auto-adjusts quality to approximate this size</div>
                  </div>
                </div>
              )}

              <div className="divider" />
              <div className="control-group">
                <div className="control-label">Output Format</div>
                <div className="pill-group">
                  {['jpeg','webp','png'].map(f => (
                    <div key={f} className={`pill ${format === f ? 'selected' : ''}`} onClick={() => setFormat(f)}>{f.toUpperCase()}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading && <div className="status-text">{status}</div>}
          <button className="btn btn-primary btn-lg btn-full" onClick={resize} disabled={loading}>
            {loading ? '⏳ Resizing…' : '📐 Resize All'}
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
                      <div className="file-meta">{r.origDim} → {r.newDim} · {fmtSize(r.origSize)} → {fmtSize(r.newSize)}</div>
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
