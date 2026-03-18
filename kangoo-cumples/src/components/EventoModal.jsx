import React, { useState, useEffect } from 'react'

const EMOJIS = ['🎂', '🎉', '🎈', '🥳', '🎁', '🎊', '⭐', '💫', '🌟', '🦄']

const eventoVacio = {
  nombre: '',
  fecha: '',
  descripcion: '',
  emoji: '🎂',
  categoria: 'personal',
}

export default function EventoModal({ evento, onGuardar, onCerrar }) {
  const [form, setForm] = useState(eventoVacio)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})

  useEffect(() => {
    if (evento) {
      setForm({ ...eventoVacio, ...evento })
    } else {
      setForm(eventoVacio)
    }
  }, [evento])

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.fecha) e.fecha = 'La fecha es obligatoria'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validar()
    if (Object.keys(errs).length) {
      setErrores(errs)
      return
    }
    setGuardando(true)
    try {
      await onGuardar(form)
      onCerrar()
    } catch (err) {
      setErrores({ general: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{evento ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button className="modal-close" onClick={onCerrar}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {errores.general && (
            <div className="error-banner">{errores.general}</div>
          )}

          <div className="form-group">
            <label>Emoji</label>
            <div className="emoji-picker">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-btn ${form.emoji === em ? 'selected' : ''}`}
                  onClick={() => cambiar('emoji', em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              placeholder="Ej: Juan García"
              className={errores.nombre ? 'input-error' : ''}
            />
            {errores.nombre && <span className="field-error">{errores.nombre}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fecha">Fecha de cumpleaños *</label>
            <input
              id="fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => cambiar('fecha', e.target.value)}
              className={errores.fecha ? 'input-error' : ''}
            />
            {errores.fecha && <span className="field-error">{errores.fecha}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              value={form.categoria}
              onChange={(e) => cambiar('categoria', e.target.value)}
            >
              <option value="personal">Personal</option>
              <option value="trabajo">Trabajo</option>
              <option value="familia">Familia</option>
              <option value="amigos">Amigos</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <textarea
              id="descripcion"
              value={form.descripcion}
              onChange={(e) => cambiar('descripcion', e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
