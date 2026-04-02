import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { fmtSize, triggerDownload } from '../utils/helpers'

export default function MergePdf() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)

  const addFiles = (newFiles) => {
    const items = newFiles.map(f => ({ file: f, name: f.name, size: f.size }))
    setFiles(prev => [...prev, ...items])
    setResult(null)
  }

  const removeFile = (i) => { setFiles(prev => prev.filter((_, idx) => idx !== i)); setResult(null) }
  const moveUp = (i) => { if (i === 0) return; setFiles(prev => { const a = [...prev]; [a[i-1],a[i]] = [a[i],a[i-1]]; return a }) }
  const moveDown = (i) => { setFiles(prev => { if (i === prev.length - 1) return prev; const a = [...prev]; [a[i],a[i+1]] = [a[i+1],a[i]]; return a }) }

  const merge = async () => {
    if (files.length < 2) return
    setLoading(true); setResult(null)
    setStatus('Loading PDF library…')

    try {
      const { PDFDocument } = await import('pdf-lib')
      setStatus('Merging PDFs…')

      const merged = await PDFDocument.create()
      let totalPages = 0

      for (let i = 0; i < files.length; i++) {
        setStatus(`Adding file ${i + 1} of ${files.length}…`)
        const buf = await files[i].file.arrayBuffer()
        const pdf = await PDFDocument.load(buf)
        const pages = await merged.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(p => { merged.addPage(p); totalPages++ })
      }

      const bytes = await merged.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      setResult({ url, size: blob.size, pages: totalPages })
      setStatus('Done!')
    } catch (err) {
      setStatus('Error: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="tool-header">
        <h2 className="tool-page-title">📎 Merge PDFs</h2>
        <p className="tool-page-desc">Combine multiple PDF files into one. Drag to reorder pages before merging.</p>
      </div>

      <Dropzone
        onFiles={addFiles}
        accept=".pdf,application/pdf"
        multiple
        label="Drop PDF files here"
        sublabel="Add 2 or more PDFs to merge"
      />

      {files.length > 0 && (
        <>
          <div className="card" style={{ margin: '20px 0' }}>
            <div className="card-header">
              <span className="card-title">{files.length} PDF{files.length > 1 ? 's' : ''} — reorder before merging</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setFiles([]); setResult(null) }}>Clear</button>
            </div>
            <div className="card-body" style={{ padding: '12px 16px' }}>
              {files.map((f, i) => (
                <div key={i} className="file-row">
                  <div className="file-thumb-placeholder">📄</div>
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-meta">{fmtSize(f.size)}</div>
                  </div>
                  <div className="file-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => moveUp(i)} disabled={i === 0} title="Move up">↑</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => moveDown(i)} disabled={i === files.length - 1} title="Move down">↓</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeFile(i)} style={{ color: 'var(--danger)' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {files.length < 2 && (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 16 }}>
              Add at least 2 PDF files to merge
            </div>
          )}

          {loading && <div className="status-text">{status}</div>}

          <button className="btn btn-primary btn-lg btn-full" onClick={merge} disabled={loading || files.length < 2}>
            {loading ? '⏳ Merging…' : `📎 Merge ${files.length} PDFs`}
          </button>

          {result && (
            <div className="result-card" style={{ marginTop: 16 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div className="result-info">
                <div className="result-name">merged.pdf</div>
                <div className="result-meta">{result.pages} pages · {fmtSize(result.size)}</div>
              </div>
              <button className="btn btn-primary" onClick={() => triggerDownload(result.url, 'pixelkit-merged.pdf')}>
                ⬇ Download
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
