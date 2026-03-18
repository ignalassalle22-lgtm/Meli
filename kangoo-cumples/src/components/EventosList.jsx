import React from 'react'

function diasHastaCumple(fecha) {
  const hoy = new Date()
  const cumple = new Date(fecha)
  cumple.setFullYear(hoy.getFullYear())
  if (cumple < hoy) cumple.setFullYear(hoy.getFullYear() + 1)
  const diff = Math.ceil((cumple - hoy) / (1000 * 60 * 60 * 24))
  return diff
}

function badgeDias(dias) {
  if (dias === 0) return { texto: '¡Hoy! 🎉', clase: 'badge-hoy' }
  if (dias <= 7) return { texto: `En ${dias}d`, clase: 'badge-proximo' }
  if (dias <= 30) return { texto: `En ${dias}d`, clase: 'badge-mes' }
  return { texto: `En ${dias}d`, clase: 'badge-lejano' }
}

export default function EventosList({ eventos, loading, onEditar, onEliminar }) {
  if (loading) {
    return (
      <div className="eventos-empty">
        <span className="spinner" />
        <p>Cargando eventos...</p>
      </div>
    )
  }

  if (!eventos.length) {
    return (
      <div className="eventos-empty">
        <span className="empty-icon">🎈</span>
        <p>No hay eventos todavía. ¡Agregá el primero!</p>
      </div>
    )
  }

  const ordenados = [...eventos].sort((a, b) => diasHastaCumple(a.fecha) - diasHastaCumple(b.fecha))

  return (
    <div className="eventos-list">
      {ordenados.map((evento) => {
        const dias = diasHastaCumple(evento.fecha)
        const badge = badgeDias(dias)
        return (
          <div key={evento.id} className={`evento-card ${dias === 0 ? 'evento-hoy' : ''}`}>
            <div className="evento-avatar">
              {evento.emoji || '🎂'}
            </div>
            <div className="evento-info">
              <div className="evento-nombre">{evento.nombre}</div>
              {evento.descripcion && (
                <div className="evento-descripcion">{evento.descripcion}</div>
              )}
              <div className="evento-fecha">
                {new Date(evento.fecha).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
            </div>
            <div className="evento-right">
              <span className={`badge ${badge.clase}`}>{badge.texto}</span>
              <div className="evento-acciones">
                <button
                  className="btn-icon"
                  title="Editar"
                  onClick={() => onEditar(evento)}
                >
                  ✏️
                </button>
                <button
                  className="btn-icon btn-icon-danger"
                  title="Eliminar"
                  onClick={() => onEliminar(evento.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
