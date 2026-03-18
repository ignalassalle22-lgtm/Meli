import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export function useEventos() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEventos = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setEventos(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEventos()
  }, [fetchEventos])

  const crearEvento = async (evento) => {
    const { data, error } = await supabase
      .from('eventos')
      .insert([evento])
      .select()
      .single()

    if (error) throw new Error(error.message)
    setEventos((prev) => [...prev, data])
    return data
  }

  const actualizarEvento = async (id, cambios) => {
    const { data, error } = await supabase
      .from('eventos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    setEventos((prev) => prev.map((e) => (e.id === id ? data : e)))
    return data
  }

  const eliminarEvento = async (id) => {
    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setEventos((prev) => prev.filter((e) => e.id !== id))
  }

  return {
    eventos,
    loading,
    error,
    fetchEventos,
    crearEvento,
    actualizarEvento,
    eliminarEvento,
  }
}
