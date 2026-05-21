import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { api } from '../../services/api'
import { useSimStore } from '../../store/simStore'

// Colores para el PieChart — mapeados a los mismos colores del resto del dashboard
const STATUS_COLORS = {
  PAID: '#4ade80',      // verde — entregas exitosas
  FREE: '#e94560',      // rojo — SLA fallado
  IN_DELIVERY: '#4cc9f0', // azul — en tránsito
  COOKING: '#fbbf24',  // amarillo — en cocina
  PENDING: '#64748b',  // gris — en espera
  OTHER: '#94a3b8',
}

function groupByStatus(orders) {
  const counts = {}
  for (const o of orders) {
    const key = ['PAID', 'FREE', 'IN_DELIVERY', 'COOKING', 'PACKED', 'PENDING'].includes(o.status)
      ? o.status : 'OTHER'
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

// OrdersChart: visualizaciones de la actividad del simulador.
// LineChart: historial de órdenes completadas por ventana de sim_time.
// PieChart: distribución del status actual (tiempo real desde el store).
// Razón de dos gráficos: el Line muestra tendencia histórica, el Pie muestra
// el estado instantáneo — información complementaria, no redundante.
export function OrdersChart() {
  const orders = useSimStore(s => s.orders)
  const [timeline, setTimeline] = useState([])

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const data = await api.getTimeline()
        setTimeline(data)
      } catch (e) {}
    }
    fetchTimeline()
    const interval = setInterval(fetchTimeline, 8000) // menos frecuente que summary
    return () => clearInterval(interval)
  }, [])

  const pieData = groupByStatus(orders)

  return (
    <div>
      <div style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '2px', marginBottom: '10px' }}>
        ── GRÁFICAS ──
      </div>

      {/* LineChart: órdenes completadas a lo largo del tiempo */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '6px' }}>
          Órdenes completadas / tiempo sim
        </div>
        {timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={timeline}>
              <XAxis
                dataKey="sim_time"
                tick={{ fill: '#64748b', fontSize: 8 }}
                tickFormatter={v => `${Math.floor(v)}s`}
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 8 }} width={20} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', fontSize: '9px' }}
                labelFormatter={v => `sim: ${v}s`}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#4cc9f0"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: 'var(--text-dim)', fontSize: '9px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            sin datos aún — crea pedidos para ver la gráfica
          </div>
        )}
      </div>

      {/* PieChart: distribución de status en tiempo real */}
      <div>
        <div style={{ color: 'var(--text-dim)', fontSize: '8px', marginBottom: '6px' }}>
          Distribución de estados (últimas 20 órdenes)
        </div>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={55}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={8}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || STATUS_COLORS.OTHER} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2d3748', fontSize: '9px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: 'var(--text-dim)', fontSize: '9px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            sin pedidos en memoria
          </div>
        )}
      </div>
    </div>
  )
}
