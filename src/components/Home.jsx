import { useNavigate } from 'react-router-dom'
import Footer from './Footer'

export default function Home({ tools }) {
  const navigate = useNavigate()

  return (
    <div className="page-content" style={{ paddingTop: 20 }}>
      <div className="tools-grid">
        {tools.map((tool) => (
          <div key={tool.id} className="tool-card" onClick={() => navigate(`/tool/${tool.id}`)}>
            <div className="tool-card-icon">{tool.icon}</div>
            <div>
              <div className="tool-card-title">{tool.name}</div>
              <div className="tool-card-desc">{tool.desc}</div>
            </div>
            <div className="tool-card-tag">
              {tool.tags.map(t => (
                <span key={t} style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '1px 6px', fontSize: 11,
                  marginRight: 4, fontFamily: 'var(--font-mono)', color: 'var(--text-3)'
                }}>#{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
        <div className="home-info-strip" style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 260px', minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.5px', marginBottom: 6 }}>
              // image &amp; pdf toolkit
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 8, lineHeight: 1.3 }}>
              Everything you need <strong>in one place.</strong>
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65 }}>
              Convert, compress, resize, and transform your images and PDFs —
              all processed locally in your browser. No server, no upload limits, no account needed.
            </p>
          </div>

          <div className="home-features-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, minWidth: 0 }}>
            {[
              { icon: '🔒', label: 'Private by default', desc: 'Files never leave your device' },
              { icon: '⚡', label: 'Instant processing', desc: 'No upload wait time' },
              { icon: '🆓', label: 'Free forever', desc: 'No account, no limits' },
            ].map(f => (
              <div key={f.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: 22 }}>{f.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
