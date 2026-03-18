import React, { useState, useEffect } from 'react'

export default function Config({ config, onGuardar }) {
  const [form, setForm] = useState(config)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    setForm(config)
  }, [config])

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onGuardar(form)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  return (
    <div className="config-panel">
      <h2>⚙️ Configuración</h2>

      <form className="config-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombreOrganizacion">Nombre de la organización</label>
          <input
            id="nombreOrganizacion"
            type="text"
            value={form.nombreOrganizacion || ''}
            onChange={(e) => cambiar('nombreOrganizacion', e.target.value)}
            placeholder="Mi Empresa"
          />
        </div>

        <div className="form-group">
          <label htmlFor="diasAnticipacion">
            Días de anticipación para alertas
          </label>
          <input
            id="diasAnticipacion"
            type="number"
            min={1}
            max={60}
            value={form.diasAnticipacion || 7}
            onChange={(e) => cambiar('diasAnticipacion', Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tema">Tema visual</label>
          <select
            id="tema"
            value={form.tema || 'claro'}
            onChange={(e) => cambiar('tema', e.target.value)}
          >
            <option value="claro">Claro</option>
            <option value="oscuro">Oscuro</option>
          </select>
        </div>

        <div className="form-group form-group-check">
          <label>
            <input
              type="checkbox"
              checked={!!form.notificaciones}
              onChange={(e) => cambiar('notificaciones', e.target.checked)}
            />
            Activar notificaciones de cumpleaños
          </label>
        </div>

        <button type="submit" className="btn-primary">
          {guardado ? '✅ Guardado!' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  )
}
