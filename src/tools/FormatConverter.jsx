import { useState } from 'react'
import Dropzone from '../components/Dropzone'
import { fmtSize, fileToDataUrl, loadImage, triggerDownload, stripExt } from '../utils/helpers'

const FORMATS = [
  { value: 'jpeg', label: 'JPG / JPEG', mime: 'image/jpeg', ext: 'jpg' },
  { value: 'png',  label: 'PNG',        mime: 'image/png',  ext: 'png' },
  { value: 'webp', label: 'WebP',       mime: 'image/webp', ext: 'webp' },
  { value: 'bmp',  label: 'BMP',        mime: 'image/bmp',  ext: 'bmp' },
  { value: 'gif',  label: 'GIF',        mime: 'image/gif',  ext: 'gif' },
  { value: 'ico',  label: 'ICO',        mime: 'image/png',  ext: 'ico', note: 'saved as PNG' },
  { value: 'svg',  label: 'SVG',        mime: 'image/svg+xml', ext: 'svg', note: 'embedded raster' },
]

const NOTES = {
  jpeg: 'ℹ️ Transparent areas will be filled with white',
  png:  'ℹ️ Lossless — transparency preserved',
  webp: 'ℹ️ Best compression — supported in all modern browsers',
  svg:  '⚠️ This embeds the raster image inside an SVG wrapper — not true vector. For real vector SVG you need an auto-tracing tool like Inkscape or Vector Magic.',
}

function getExt(file) {
  return file.name.split('.').pop().toLowerCase()
}

async function convertToSvg(item) {
  const img = await loadImage(item.dataUrl)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <!-- Raster image embedded in SVG wrapper. Not true vector. -->
  <image href="${item.dataUrl}" x="0" y="0" width="${w}" height="${h}"/>
</svg>`
  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  const dataUrl = URL.createObjectURL(blob)
  return { blob, dataUrl, size: blob.size }
}

export default function FormatConverter() {
  const [files, setFiles]     = useState([])
  const [target, setTarget]   = useState('jpeg')
  const [quality, setQuality] = useState(92)
  const [loading, setLoading] = useState(false)
  const [status, setStatus]   = useState('')
  const [results, setResults] = useState([])

  const addFiles = async (newFiles) => {
    const items = await Promise.all(newFiles.map(async f => ({
      file: f, name: f.name, size: f.size,
      ext: getExt(f),
      dataUrl: await fileToDataUrl(f),
    })))
    setFiles(prev => [...prev, ...items])
    setResults([])
  }

  const convert = async () => {
    if (!files.length) return
    setLoading(true); setResults([])
    const fmt = FORMATS.find(f => f.value === target)
    const out = []

    for (let i = 0; i < files.length; i++) {
      setStatus(`Converting ${i + 1} of ${files.length}…`)
      const item = files[i]

      if (item.ext === fmt.ext || (fmt.value === 'jpeg' && item.ext === 'jpg')) {
        out.push({ ...item, newSize: item.size, skipped: true })
        continue
      }

      // SVG — embed raster
      if (target === 'svg') {
        const { blob, dataUrl, size } = await convertToSvg(item)
        out.push({ dataUrl, blob, name: stripExt(item.name) + '.svg', origSize: item.size, newSize: size, origExt: item.ext, newExt: 'svg', skipped: false })
        continue
      }

      const img = await loadImage(item.dataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')

      if (fmt.value === 'jpeg' || fmt.value === 'bmp') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)

      const q = (fmt.value === 'png' || fmt.value === 'bmp' || fmt.value === 'gif') ? undefined : quality / 100
      const blob = await new Promise(res => canvas.toBlob(res, fmt.mime, q))
      const dataUrl = await new Promise(res => {
        const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(blob)
      })

      out.push({ dataUrl, blob, name: stripExt(item.name) + '.' + fmt.ext, origSize: item.size, newSize: blob.size, origExt: item.ext, newExt: fmt.ext, skipped: false })
    }

    setResults(out); setStatus('Done!'); setLoading(false)
  }

  const fmt = FORMATS.find(f => f.value === target)

  return (
    <div>
      <div className="tool-header">
        <h2 className="tool-page-title">🔄 Format Converter</h2>
        <p className="tool-page-desc">Convert images between JPG, PNG, WebP, BMP, GIF, ICO, and SVG.</p>
      </div>

      <Dropzone onFiles={addFiles} accept="image/*" multiple label="Drop images to convert" sublabel="Supports JPG, PNG, WebP, BMP, GIF and more" />

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
                  <img className="file-thumb" src={f.dataUrl} alt={f.name}
                    style={{ background: 'repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 8px 8px' }} />
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-meta">{fmtSize(f.size)} · .{f.ext.toUpperCase()}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setFiles(p => p.filter((_, idx) => idx !== i))} style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Format picker */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><span className="card-title">Convert to</span></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 16 }}>
                {FORMATS.map(f => (
                  <div
                    key={f.value}
                    onClick={() => setTarget(f.value)}
                    style={{
                      padding: '12px 10px',
                      border: `1.5px solid ${target === f.value ? 'var(--text)' : 'var(--border)'}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: target === f.value ? 'var(--text)' : 'var(--surface)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: target === f.value ? 'var(--bg)' : 'var(--text)',
                      marginBottom: 3,
                    }}>
                      .{f.ext.toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)',
                      color: target === f.value ? 'rgba(255,255,255,0.6)' : 'var(--text-3)',
                    }}>
                      {f.label}
                    </div>
                    {f.note && (
                      <div style={{
                        fontSize: 10, marginTop: 3, fontFamily: 'var(--font-mono)',
                        color: target === f.value ? 'rgba(255,255,255,0.45)' : 'var(--text-3)',
                      }}>
                        {f.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quality slider for lossy formats */}
              {(target === 'jpeg' || target === 'webp') && (
                <div className="control-group" style={{ marginBottom: 12 }}>
                  <div className="control-label">
                    Quality — <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 13 }}>{quality}%</span>
                  </div>
                  <div className="slider-row">
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Low</span>
                    <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(+e.target.value)} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Max</span>
                  </div>
                </div>
              )}

              {/* Format note */}
              {NOTES[target] && (
                <div style={{
                  fontSize: 12,
                  color: target === 'svg' ? 'var(--warning)' : 'var(--text-3)',
                  fontFamily: 'var(--font-mono)',
                  padding: '10px 12px',
                  background: target === 'svg' ? 'var(--warning-light)' : 'var(--bg)',
                  borderRadius: 6,
                  lineHeight: 1.6,
                  border: target === 'svg' ? '1px solid rgba(217,119,6,0.2)' : 'none',
                }}>
                  {NOTES[target]}
                </div>
              )}
            </div>
          </div>

          {loading && <div className="status-text">{status}</div>}

          <button className="btn btn-primary btn-lg btn-full" onClick={convert} disabled={loading}>
            {loading ? '⏳ Converting…' : `🔄 Convert to .${fmt?.ext.toUpperCase()}`}
          </button>

          {results.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <span className="card-title">✅ Converted</span>
                {results.filter(r => !r.skipped).length > 1 && (
                  <button className="btn btn-outline btn-sm"
                    onClick={() => results.filter(r => !r.skipped).forEach((r, i) => setTimeout(() => triggerDownload(r.dataUrl, r.name), i * 300))}>
                    ⬇ Download All
                  </button>
                )}
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {results.map((r, i) => (
                  <div key={i} className="file-row">
                    <img className="file-thumb" src={r.dataUrl} alt={r.name}
                      style={{ background: 'repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 8px 8px' }} />
                    <div className="file-info">
                      <div className="file-name">{r.name}</div>
                      <div className="file-meta">
                        {r.skipped
                          ? 'Already in this format'
                          : `${r.origExt?.toUpperCase()} → ${r.newExt?.toUpperCase()} · ${fmtSize(r.origSize)} → ${fmtSize(r.newSize)}`
                        }
                      </div>
                    </div>
                    {r.skipped
                      ? <span className="badge badge-neutral">Skipped</span>
                      : <button className="btn btn-outline btn-sm" onClick={() => triggerDownload(r.dataUrl, r.name)}>⬇</button>
                    }
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
