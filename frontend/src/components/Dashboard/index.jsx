import { useAnalytics } from '../../hooks/useAnalytics'
import { MetricsCards } from './MetricsCards'
import { ConfigPanel } from './ConfigPanel'
import { StressPanel } from './StressPanel'
import { OrdersChart } from './OrdersChart'

// Dashboard: segunda vista de la app (tab "DASHBOARD").
// Layout 2×2: métricas+auto en columna izquierda, config en columna derecha,
// stress+charts en la fila inferior.
// Razón de este layout: las métricas son lo primero que el usuario quiere ver,
// la config está a la derecha como panel de control secundario.
export function Dashboard({ active }) {
  // Polling activo solo cuando este tab está visible — evita requests innecesarios
  useAnalytics(active)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

      {/* Columna izquierda: métricas + stress testing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <MetricsCards />
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <StressPanel />
        </div>
      </div>

      {/* Columna derecha: configuración + gráficas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <ConfigPanel />
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <OrdersChart />
        </div>
      </div>

    </div>
  )
}
