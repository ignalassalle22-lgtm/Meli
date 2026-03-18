import React from 'react'

export default function Topbar({ onNuevoEvento, vistaActiva, setVistaActiva }) {
  const tabs = [
    { id: 'lista', label: '📋 Lista' },
    { id: 'calendario', label: '📅 Calendario' },
    { id: 'metricas', label: '📊 Métricas' },
    { id: 'config', label: '⚙️ Config' },
  ]

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-icon">🎂</span>
        <span className="topbar-title">KangooCumples</span>
      </div>

      <nav className="topbar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`topbar-tab ${vistaActiva === tab.id ? 'active' : ''}`}
            onClick={() => setVistaActiva(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <button className="btn-primary" onClick={onNuevoEvento}>
        + Nuevo evento
      </button>
    </header>
  )
}
