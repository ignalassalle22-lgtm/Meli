import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const CONFIG_KEY = 'kangoo_config'

const defaultConfig = {
  nombreOrganizacion: 'Mi Empresa',
  diasAnticipacion: 7,
  tema: 'claro',
  notificaciones: true,
}

export function useConfig() {
  const [config, setConfig] = useState(defaultConfig)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarConfig = async () => {
      // Intentar cargar desde Supabase
      const { data } = await supabase
        .from('config')
        .select('*')
        .eq('clave', CONFIG_KEY)
        .maybeSingle()

      if (data?.valor) {
        setConfig({ ...defaultConfig, ...data.valor })
      } else {
        // Fallback a localStorage
        const local = localStorage.getItem(CONFIG_KEY)
        if (local) {
          try {
            setConfig({ ...defaultConfig, ...JSON.parse(local) })
          } catch (_) {}
        }
      }
      setLoading(false)
    }
    cargarConfig()
  }, [])

  const guardarConfig = async (nuevaConfig) => {
    const merged = { ...config, ...nuevaConfig }
    setConfig(merged)
    localStorage.setItem(CONFIG_KEY, JSON.stringify(merged))

    // Persistir en Supabase (upsert)
    await supabase.from('config').upsert(
      { clave: CONFIG_KEY, valor: merged },
      { onConflict: 'clave' }
    )
  }

  return { config, loading, guardarConfig }
}
