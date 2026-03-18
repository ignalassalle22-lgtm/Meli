import React from 'react'

function diasHastaCumple(fecha) {
  const hoy = new Date()
  const cumple = new Date(fecha)
  cumple.setFullYear(hoy.getFullYear())
  if (cumple < hoy) cumple.setFullYear(hoy.getFullYear() + 1)
  return Math.ceil((cumple - hoy) / (1000 * 60 * 60 * 24))
}

export default function Metricas({ eventos }) {
  const total = eventos.length

  const proximos7 = eventos.filter((e) => {
    const d = diasHastaCumple(e.fecha)
    return d <= 7
  })

  const proximos30 = eventos.filter((e) => {
    const d = diasHastaCumple(e.fecha)
    return d <= 30
  })

  // Mes con más cumpleaños
  const porMes = Array(12).fill(0)
  eventos.forEach((ev) => {
    const m = new Date(ev.fecha).getMonth()
    porMes[m]++
  })
  const maxMes = porMes.indexOf(Math.max(...porMes))
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  // Por categoría
  const porCategoria = {}
  eventos.forEach((ev) => {
    const cat = ev.categoria || 'personal'
    porCategoria[cat] = (porCategoria[cat] || 0) + 1
  })

  const proxEv = [...eventos].sort((a, b) => diasHastaCumple(a.fecha) - diasHastaCumple(b.fecha))[0]

  return (
    <div className="metricas">
      <h2 className="metricas-titulo">📊 Métricas</h2>

      <div className="metricas-grid">
        <div className="metrica-card">
          <div className="metrica-valor">{total}</div>
          <div className="metrica-label">Total de eventos</div>
        </div>
        <div className="metrica-card metrica-alert">
          <div className="metrica-valor">{proximos7.length}</div>
          <div className="metrica-label">Próximos 7 días</div>
        </div>
        <div className="metrica-card">
          <div className="metrica-valor">{proximos30.length}</div>
          <div className="metrica-label">Próximos 30 días</div>
        </div>
        <div className="metrica-card">
          <div className="metrica-valor">{total ? MESES[maxMes] : '—'}</div>
          <div className="metrica-label">Mes más activo</div>
        </div>
      </div>

      {proxEv && (
        <div className="metrica-proximo">
          <h3>Próximo cumpleaños</h3>
          <div className="proximo-card">
            <span className="proximo-emoji">{proxEv.emoji || '🎂'}</span>
            <div>
              <div className="proximo-nombre">{proxEv.nombre}</div>
              <div className="proximo-fecha">
                {new Date(proxEv.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                {' · '}en {diasHastaCumple(proxEv.fecha)} días
              </div>
            </div>
          </div>
        </div>
      )}

      {Object.keys(porCategoria).length > 0 && (
        <div className="metrica-categorias">
          <h3>Por categoría</h3>
          {Object.entries(porCategoria).map(([cat, count]) => (
            <div key={cat} className="categoria-row">
              <span className="categoria-nombre">{cat}</span>
              <div className="categoria-barra-wrap">
                <div
                  className="categoria-barra"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="categoria-count">{count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="meses-chart">
        <h3>Distribución por mes</h3>
        <div className="meses-barras">
          {porMes.map((count, idx) => (
            <div key={idx} className="mes-col">
              <div
                className="mes-barra"
                style={{ height: `${Math.max((count / Math.max(...porMes, 1)) * 80, 4)}px` }}
              />
              <div className="mes-label">{MESES[idx]}</div>
              {count > 0 && <div className="mes-count">{count}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
