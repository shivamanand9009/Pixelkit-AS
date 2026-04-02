import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ tools, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (id) => location.pathname === `/tool/${id}`;
  const isHome = location.pathname === "/";

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div
          className="sidebar-logo"
          onClick={() => handleNav("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo-mark">AS</div>
          <span className="logo-name">PixelKit</span>
          <span className="logo-badge">v1.0</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Overview</div>
          <button
            className={`nav-item ${isHome ? "active" : ""}`}
            onClick={() => handleNav("/")}
          >
            <div className="nav-icon">🏠</div>
            Home
          </button>
        </div>

        <div className="sidebar-section" style={{ flex: 1 }}>
          <div className="sidebar-label">Tools</div>
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`nav-item ${isActive(tool.id) ? "active" : ""}`}
              onClick={() => handleNav(`/tool/${tool.id}`)}
            >
              <div className="nav-icon">{tool.icon}</div>
              {tool.name}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-hint">
            All processing done in your browser.
            <br />
            No uploads, fully private. 🔒
          </div>
        </div>
      </aside>
    </>
  );
}
