import { useEffect } from 'react'
import { api } from '../services/api'
import { useSimStore } from '../store/simStore'

// Polling de métricas cada 5s.
// Por qué polling y no WebSocket: las métricas son agregaciones de DB (SQL),
// no eventos individuales. El backend no sabe cuándo un KPI cambia —
// el frontend pregunta periódicamente. 5s es suficiente para un dashboard
// sin sobrecargar la DB con queries frecuentes.
//
// El hook solo hace fetch cuando `active=true` para no consumir recursos
// cuando el usuario está en la vista SIM VIEWER.
export function useAnalytics(active = true) {
  const updateMetrics = useSimStore(s => s.updateMetrics)

  useEffect(() => {
    if (!active) return

    async function fetchMetrics() {
      try {
        const summary = await api.getAnalyticsSummary()
        updateMetrics(summary)
      } catch (e) {
        // silenciar errores de red — el dashboard seguirá mostrando últimos valores
      }
    }

    fetchMetrics() // fetch inmediato al montar
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [active, updateMetrics])
}
