import { useSimStore } from '../../store/simStore'

// KPI card individual con color semántico según el tipo de métrica
function Card({ label, value, unit = '', color = 'var(--accent-blue)', sublabel }) {
  return (
    <div style={{
      background: 'var(--bg-kitchen)',
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '6px',
      padding: '12px 16px',
    }}>
      <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '6px', letterSpacing: '2px' }}>
        {label}
      </div>
      <div style={{ color, fontSize: '22px', fontFamily: 'monospace', letterSpacing: '-1px' }}>
        {value}<span style={{ fontSize: '11px', marginLeft: '4px', color: 'var(--text-dim)' }}>{unit}</span>
      </div>
      {sublabel && (
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginTop: '4px' }}>{sublabel}</div>
      )}
    </div>
  )
}

// MetricsCards: panel de KPIs del simulador.
// Datos del store (actualizados por useAnalytics polling + WebSocket órdenes).
export function MetricsCards() {
  const metrics = useSimStore(s => s.metrics)
  const orders = useSimStore(s => s.orders)

  const onTimePercent = Math.round(metrics.on_time_rate * 100)
  const freePercent = metrics.completed > 0
    ? Math.round((metrics.free_deliveries / metrics.completed) * 100)
    : 0

  return (
    <div>
      <div style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '2px', marginBottom: '10px' }}>
        ── MÉTRICAS ──
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <Card
          label="TOTAL PEDIDOS"
          value={metrics.total_orders}
          color="var(--accent-blue)"
          sublabel={`${metrics.in_progress} en proceso`}
        />
        <Card
          label="COMPLETADOS"
          value={metrics.completed}
          color="var(--accent-green)"
          sublabel={`${metrics.free_deliveries} gratis 🚨`}
        />
        <Card
          label="ON-TIME RATE"
          value={onTimePercent}
          unit="%"
          color={onTimePercent >= 80 ? 'var(--accent-green)' : 'var(--accent-red)'}
          sublabel={`${freePercent}% entregas gratis`}
        />
        <Card
          label="ÓRDENES LOCALES"
          value={orders.length}
          color="var(--accent-yellow)"
          sublabel="últimas 20 en memoria"
        />
      </div>
    </div>
  )
}
