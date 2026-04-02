import { useLocation, useNavigate } from 'react-router-dom'

export default function Topbar({ tools, onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()

  const toolId = location.pathname.split('/tool/')[1]
  const tool = tools.find(t => t.id === toolId)

  return (
    <header className="topbar">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        style={{
          display: 'none',
          width: 34,
          height: 34,
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border)',
          borderRadius: 6,
          background: 'none',
          cursor: 'pointer',
          color: 'var(--text)',
          flexShrink: 0,
        }}
        className="menu-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {tool ? (
        <>
          <span style={{ fontSize: 18 }}>{tool.icon}</span>
          <span className="topbar-title">{tool.name}</span>
          <span className="topbar-sub topbar-sub-hide">— {tool.desc}</span>
        </>
      ) : (
        <span className="topbar-title">PixelKit</span>
      )}

      <div className="topbar-actions">
        {tool && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            ← All Tools
          </button>
        )}
      </div>
    </header>
  )
}
