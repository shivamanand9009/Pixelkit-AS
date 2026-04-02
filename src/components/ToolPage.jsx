import { useParams, useNavigate } from 'react-router-dom'
import ImageToPdf from '../tools/ImageToPdf'
import Compress from '../tools/Compress'
import Resize from '../tools/Resize'
import RemoveBg from '../tools/RemoveBg'
import MergePdf from '../tools/MergePdf'
import Watermark from '../tools/Watermark'
import FormatConverter from '../tools/FormatConverter'
import Footer from './Footer'

const TOOL_MAP = {
  'image-to-pdf':     ImageToPdf,
  'compress':         Compress,
  'resize':           Resize,
  'format-converter': FormatConverter,
  'remove-bg':        RemoveBg,
  'merge-pdf':        MergePdf,
  'watermark':        Watermark,
}

export default function ToolPage({ tools }) {
  const { toolId } = useParams()
  const navigate = useNavigate()
  const Tool = TOOL_MAP[toolId]

  if (!Tool) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">Tool not found</div>
          <div className="empty-desc">
            <button className="btn btn-outline" style={{ marginTop: 12 }} onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="page-content tool-page">
      <Tool />
      <Footer />
    </div>
  )
}
