import { useCallback } from 'react'

export default function Dropzone({ onFiles, accept = 'image/*', multiple = true, label, sublabel }) {
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('active')
    const files = Array.from(e.dataTransfer.files)
    const filtered = files.filter(f => {
      if (accept === 'image/*') return f.type.startsWith('image/')
      if (accept === '.pdf,application/pdf') return f.type === 'application/pdf'
      return true
    })
    if (filtered.length) onFiles(filtered)
  }, [onFiles, accept])

  const handleChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  const inputId = `dz-${Math.random().toString(36).slice(2)}`

  return (
    <div
      className="dropzone"
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('active') }}
      onDragLeave={(e) => e.currentTarget.classList.remove('active')}
      onDrop={handleDrop}
      onClick={() => document.getElementById(inputId).click()}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <span className="dz-icon">📂</span>
      <div className="dz-title">{label || 'Drop files here or click to browse'}</div>
      <div className="dz-sub">{sublabel || (accept === 'image/*' ? 'JPG, PNG, WebP, GIF supported' : 'PDF files only')}</div>
    </div>
  )
}
