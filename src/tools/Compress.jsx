import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { fmtSize, fileToDataUrl, loadImage, canvasToBlob, blobToDataUrl, triggerDownload, stripExt } from '../utils/helpers'

export default function Compress() {
  const [files, setFiles] = useState([])
  const [quality, setQuality] = useState(70)
  const [format, setFormat] = useState('jpeg')
  const [maxW, setMaxW] = useState('')
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

  const removeFile = (i) => { setFiles(prev => prev.filter((_, idx) => idx !== i)); setResults([]) }

  const compress = async () => {
    setLoading(true); setResults([])
    const out = []
    for (let i = 0; i < files.length; i++) {
      setStatus(`Compressing ${i + 1} of ${files.length}…`)
      const item = files[i]
      const img = await loadImage(item.dataUrl)
      const canvas = document.createElement('canvas')
      let w = img.naturalWidth, h = img.naturalHeight
      const mw = parseInt(maxW)
      if (mw && w > mw) { h = Math.round(h * mw / w); w = mw }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const blob = await canvasToBlob(canvas, format, quality)
      const dataUrl = await blobToDataUrl(blob)
      const ext = format === 'jpeg' ? 'jpg' : format
      out.push({ dataUrl, blob, name: stripExt(item.name) + '_compressed.' + ext, origSize: item.size, newSize: blob.size })
    }
    setResults(out); setStatus('Done!'); setLoading(false)
  }

  return (
    <div>
      <div className="tool-header">
        <h2 className="tool-page-title">🗜️ Compress Image</h2>
        <p className="tool-page-desc">Shrink image file size. Adjust quality and output format.</p>
      </div>

      <Dropzone onFiles={addFiles} accept="image/*" multiple label="Drop images to compress" />

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
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFile(i)} style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Options</span></div>
            <div className="card-body">
              <div className="controls-section">
                <div className="control-group">
                  <div className="control-label">Quality — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>{quality}%</span></div>
                  <div className="slider-row">
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Small</span>
                    <input type="range" min="5" max="95" value={quality} onChange={e => setQuality(+e.target.value)} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Sharp</span>
                  </div>
                </div>
                <div className="control-group">
                  <div className="control-label">Output Format</div>
                  <div className="pill-group">
                    {['jpeg','webp','png'].map(f => (
                      <div key={f} className={`pill ${format === f ? 'selected' : ''}`} onClick={() => setFormat(f)}>
                        {f.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="control-group">
                  <div className="control-label">Max Width <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>(optional)</span></div>
                  <input type="number" value={maxW} onChange={e => setMaxW(e.target.value)} placeholder="e.g. 1920" min="100" max="8000" style={{ width: 140 }} />
                  <div className="control-hint">Leave empty to keep original dimensions</div>
                </div>
              </div>
            </div>
          </div>

          {loading && <div className="status-text">{status}</div>}

          <button className="btn btn-primary btn-lg btn-full" onClick={compress} disabled={loading}>
            {loading ? '⏳ Compressing…' : '🗜️ Compress All'}
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
                {results.map((r, i) => {
                  const saved = r.origSize - r.newSize
                  const pct = ((Math.abs(saved) / r.origSize) * 100).toFixed(1)
                  return (
                    <div key={i} className="file-row">
                      <img className="file-thumb" src={r.dataUrl} alt={r.name} />
                      <div className="file-info">
                        <div className="file-name">{r.name}</div>
                        <div className="file-meta">{fmtSize(r.origSize)} → {fmtSize(r.newSize)}</div>
                      </div>
                      <span className={`badge ${saved > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {saved > 0 ? `▼ ${pct}%` : `▲ ${pct}%`}
                      </span>
                      <button className="btn btn-outline btn-sm" onClick={() => triggerDownload(r.dataUrl, r.name)}>⬇</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
