import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import ToolPage from './components/ToolPage'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

export const TOOLS = [
  { id: 'image-to-pdf',     name: 'Image → PDF',        icon: '📄', desc: 'Convert one or multiple images into a single PDF file.',    tags: ['image', 'pdf'] },
  { id: 'compress',         name: 'Compress Image',      icon: '🗜️', desc: 'Reduce image file size without losing quality.',           tags: ['compress', 'image'] },
  { id: 'resize',           name: 'Resize Image',        icon: '📐', desc: 'Scale images by pixels, percent, or target file size.',    tags: ['resize', 'image'] },
  { id: 'format-converter', name: 'Format Converter',    icon: '🔄', desc: 'Convert images between JPG, PNG, WebP, BMP, GIF, ICO.',   tags: ['convert', 'image'] },
  { id: 'remove-bg',        name: 'Remove Background',   icon: '✂️', desc: 'Remove image backgrounds automatically.',                 tags: ['image', 'bg'] },
  { id: 'merge-pdf',        name: 'Merge PDFs',          icon: '📎', desc: 'Combine multiple PDF files into one document.',           tags: ['pdf', 'merge'] },
  { id: 'watermark',        name: 'Add Watermark',       icon: '💧', desc: 'Add text watermarks to your photos.',                     tags: ['image', 'watermark'] },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar tools={TOOLS} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Topbar tools={TOOLS} onMenuClick={() => setSidebarOpen(true)} />
        <Routes>
          <Route path="/" element={<Home tools={TOOLS} />} />
          <Route path="/tool/:toolId" element={<ToolPage tools={TOOLS} />} />
        </Routes>
      </div>
    </div>
  )
}
