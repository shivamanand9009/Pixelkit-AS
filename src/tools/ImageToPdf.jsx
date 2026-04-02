import { useState, useRef } from 'react'
import Dropzone from '../components/Dropzone'
import { fmtSize, fileToDataUrl, loadImage, triggerDownload } from '../utils/helpers'

export default function ImageToPdf() {
  const [files, setFiles] = useState([])
  const [pageSize, setPageSize] = useState('a4')
  const [orient, setOrient] = useState('portrait')
  const [quality, setQuality] = useState(90)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const addFiles = async (newFiles) => {
    const items = await Promise.all(newFiles.map(async f => ({
      file: f,
      name: f.name,
      size: f.size,
      dataUrl: await fileToDataUrl(f)
    })))
    setFiles(prev => [...prev, ...items])
    setResult(null)
  }

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const moveUp = (i) => {
    if (i === 0) return
    setFiles(prev => { const a = [...prev]; [a[i-1],a[i]] = [a[i],a[i-1]]; return a })
  }

  const moveDown = (i) => {
    setFiles(prev => {
      if (i === prev.length - 1) return prev
      const a = [...prev]; [a[i],a[i+1]] = [a[i+1],a[i]]; return a
    })
  }

  const convert = async () => {
    if (!files.length) return
    setLoading(true); setResult(null); setProgress(0)

    try {
      const { jsPDF } = await import('jspdf')
      let pdf = null

      for (let i = 0; i < files.length; i++) {
        setStatus(`Processing image ${i + 1} of ${files.length}…`)
        setProgress(((i + 1) / files.length) * 90)

        const img = await loadImage(files[i].dataUrl)
        const iw = img.naturalWidth, ih = img.naturalHeight

        let pw, ph
        if (pageSize === 'a4') { pw = 210; ph = 297 }
        else if (pageSize === 'letter') { pw = 215.9; ph = 279.4 }
        else { pw = iw * 0.264583; ph = ih * 0.264583 }

        const finalOrient = pageSize === 'fit' ? (iw > ih ? 'landscape' : 'portrait') : orient

        if (!pdf) {
          pdf = new jsPDF({ orientation: finalOrient, unit: 'mm', format: pageSize === 'fit' ? [pw, ph] : pageSize })
        } else {
          pdf.addPage(pageSize === 'fit' ? [pw, ph] : pageSize, finalOrient)
        }

        const pdfW = pdf.internal.pageSize.getWidth()
        const pdfH = pdf.internal.pageSize.getHeight()
        let drawW = pdfW, drawH = (ih / iw) * pdfW
        if (drawH > pdfH) { drawH = pdfH; drawW = (iw / ih) * pdfH }
        const x = (pdfW - drawW) / 2, y = (pdfH - drawH) / 2

        pdf.addImage(files[i].dataUrl, 'JPEG', x, y, drawW, drawH, undefined, 'FAST')
      }

      setProgress(100); setStatus('PDF generated!')
      const blob = pdf.output('blob')
      const url = URL.createObjectURL(blob)
      setResult({ url, size: blob.size, pages: files.length })
    } catch (err) {
      setStatus('Error: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="tool-header">
        <h2 className="tool-page-title">📄 Image → PDF</h2>
        <p className="tool-page-desc">Add images below, reorder them, then convert to a single PDF.</p>
      </div>

      <Dropzone
        onFiles={addFiles}
        accept="image/*"
        multiple
        label="Drop images here"
        sublabel="JPG, PNG, WebP · multiple files supported"
      />

      {files.length > 0 && (
        <>
          <div className="card" style={{ margin: '20px 0' }}>
            <div className="card-header">
              <span className="card-title">{files.length} image{files.length > 1 ? 's' : ''} selected</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setFiles([])}>Clear all</button>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {files.map((f, i) => (
                <div key={i} className="file-row">
                  <img className="file-thumb" src={f.dataUrl} alt={f.name} />
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-meta">{fmtSize(f.size)}</div>
                  </div>
                  <div className="file-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => moveDown(i)} disabled={i === files.length - 1}>↓</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeFile(i)} style={{ color: 'var(--danger)' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Options</span></div>
            <div className="card-body">
              <div className="controls-section">
                <div className="control-group">
                  <div className="control-label">Page Size</div>
                  <div className="pill-group">
                    {['a4','letter','fit'].map(s => (
                      <div key={s} className={`pill ${pageSize === s ? 'selected' : ''}`} onClick={() => setPageSize(s)}>
                        {s === 'a4' ? 'A4' : s === 'letter' ? 'Letter' : 'Fit Image'}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="control-group">
                  <div className="control-label">Orientation</div>
                  <div className="pill-group">
                    {['portrait','landscape'].map(o => (
                      <div key={o} className={`pill ${orient === o ? 'selected' : ''}`} onClick={() => setOrient(o)}>
                        {o.charAt(0).toUpperCase() + o.slice(1)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="control-group">
                  <div className="control-label">Quality</div>
                  <div className="slider-row">
                    <input type="range" min="50" max="100" value={quality} onChange={e => setQuality(+e.target.value)} />
                    <span className="slider-val">{quality}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ marginBottom: 16 }}>
              <div className="progress-wrap"><div className="progress-bar" style={{ width: progress + '%' }} /></div>
              <div className="status-text">{status}</div>
            </div>
          )}

          <button className="btn btn-primary btn-lg btn-full" onClick={convert} disabled={loading}>
            {loading ? '⏳ Converting…' : '📄 Convert to PDF'}
          </button>

          {result && (
            <div className="result-card" style={{ marginTop: 16 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div className="result-info">
                <div className="result-name">output.pdf</div>
                <div className="result-meta">{result.pages} page{result.pages > 1 ? 's' : ''} · {fmtSize(result.size)}</div>
              </div>
              <button className="btn btn-primary" onClick={() => triggerDownload(result.url, 'pixelkit-output.pdf')}>
                ⬇ Download
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
