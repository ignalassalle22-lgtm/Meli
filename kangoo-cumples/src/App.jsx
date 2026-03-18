import React, { useState } from 'react'
import Topbar from './components/Topbar'
import EventosList from './components/EventosList'
import EventoModal from './components/EventoModal'
import Calendario from './components/Calendario'
import Metricas from './components/Metricas'
import Config from './components/Config'
import { useEventos } from './hooks/useEventos'
import { useConfig } from './hooks/useConfig'

export default function App() {
  const { eventos, loading, error, crearEvento, actualizarEvento, eliminarEvento } = useEventos()
  const { config, guardarConfig } = useConfig()

  const [vistaActiva, setVistaActiva] = useState('lista')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [eventoEditando, setEventoEditando] = useState(null)

  const abrirNuevo = () => {
    setEventoEditando(null)
    setModalAbierto(true)
  }

  const abrirEditar = (evento) => {
    setEventoEditando(evento)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEventoEditando(null)
  }

  const handleGuardar = async (form) => {
    if (eventoEditando) {
      await actualizarEvento(eventoEditando.id, form)
    } else {
      await crearEvento(form)
    }
  }

  const handleEliminar = async (id) => {
    if (window.confirm('¿Eliminar este evento?')) {
      await eliminarEvento(id)
    }
  }

  return (
    <div className={`app tema-${config.tema || 'claro'}`}>
      <Topbar
        onNuevoEvento={abrirNuevo}
        vistaActiva={vistaActiva}
        setVistaActiva={setVistaActiva}
      />

      <main className="main-content">
        {error && (
          <div className="error-banner">
            Error al cargar datos: {error}
          </div>
        )}

        {vistaActiva === 'lista' && (
          <EventosList
            eventos={eventos}
            loading={loading}
            onEditar={abrirEditar}
            onEliminar={handleEliminar}
          />
        )}

        {vistaActiva === 'calendario' && (
          <Calendario eventos={eventos} onEditar={abrirEditar} />
        )}

        {vistaActiva === 'metricas' && (
          <Metricas eventos={eventos} />
        )}

        {vistaActiva === 'config' && (
          <Config config={config} onGuardar={guardarConfig} />
        )}
      </main>

      {modalAbierto && (
        <EventoModal
          evento={eventoEditando}
          onGuardar={handleGuardar}
          onCerrar={cerrarModal}
        />
      )}
    </div>
  )
}
