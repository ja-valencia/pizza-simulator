import { useState } from 'react'
import { useSimStore } from '../store/simStore'
import { api } from '../services/api'

// SimPanel — Panel de control inline con 3 secciones + velocidad/tiempo siempre visibles.
// Cada slider hace PUT /config al soltar (onMouseUp) para no spamear el backend.

const PRICE_PER_PIZZA = 10  // $ por pizza — constante display en OrdersTable

function Slider({ label, value, min, max, step, unit = '', onCommit, hint }) {
  const [local, setLocal] = useState(null)
  const display = local ?? value
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)', color: 'var(--text-dim)' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', fontWeight: 'bold', color: 'var(--accent-yellow)', minWidth: 50, textAlign: 'right' }}>
          {display}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={display}
        onChange={e => setLocal(Number(e.target.value))}
        onMouseUp={e => { onCommit(Number(e.target.value)); setLocal(null) }}
        onTouchEnd={e => { onCommit(Number(e.target.value)); setLocal(null) }}
        style={{ width: '100%', accentColor: 'var(--accent-yellow)', cursor: 'pointer' }}
      />
      {hint && <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-dim)', marginTop: 1, fontStyle: 'italic' }}>{hint}</div>}
    </div>
  )
}

function SectionHeader({ emoji, title, open, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: '100%', padding: '8px 12px', background: 'var(--bg-kitchen)',
      border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: open ? 0 : 4,
      borderBottomLeftRadius: open ? 0 : 4, borderBottomRightRadius: open ? 0 : 4,
      fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)', color: 'var(--text-primary)',
    }}>
      <span>{emoji}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
      <span style={{ color: 'var(--text-dim)' }}>{open ? '▼' : '▶'}</span>
    </button>
  )
}

function SectionBody({ children, open }) {
  if (!open) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderTop: 'none', borderRadius: '0 0 4px 4px',
      padding: '12px 14px', marginBottom: 8,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px',
    }}>
      {children}
    </div>
  )
}

export function SimPanel() {
  const [open, setOpen] = useState(true)
  const [sections, setSections] = useState({ mostrador: true, cocina: true, entrega: true })
  const config   = useSimStore(s => s.config)
  const timeUnit = useSimStore(s => s.timeUnit)
  const setTimeUnit = useSimStore(s => s.setTimeUnit)
  const [localSpeed, setLocalSpeed] = useState(null)

  const cfg = config || {}
  const speed = localSpeed ?? cfg.sim_speed_multiplier ?? 1

  const commit = async (patch) => {
    try { await api.updateConfig({ ...cfg, ...patch }) }
    catch (e) { console.error('[SimPanel]', e) }
  }

  const toggle = (s) => setSections(prev => ({ ...prev, [s]: !prev[s] }))

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 12 }}>

      {/* Header del panel */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '8px 14px', background: 'transparent',
        border: 'none', borderBottom: open ? '1px solid var(--border)' : 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)',
        color: 'var(--text-dim)', letterSpacing: '1px',
      }}>
        <span>{open ? '▼' : '▶'}</span>
        <span>PANEL DE CONTROL</span>
      </button>

      {open && (
        <div style={{ padding: '12px 14px' }}>

          {/* ── Barra de velocidad + tiempo (siempre visible) ── */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14,
            padding: '10px 12px', background: 'var(--bg-kitchen)', borderRadius: 4,
            border: '1px solid var(--border)',
          }}>
            {/* Velocidad */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)', color: 'var(--text-dim)' }}>⚡ VELOCIDAD</span>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 'bold', color: 'var(--accent-yellow)', fontSize: 'var(--fs-sm)' }}>{speed}x</span>
              </div>
              <input type="range" min={0.5} max={10} step={0.5} value={speed}
                onChange={e => setLocalSpeed(Number(e.target.value))}
                onMouseUp={e => { commit({ sim_speed_multiplier: Number(e.target.value) }); setLocalSpeed(null) }}
                style={{ width: '100%', accentColor: 'var(--accent-yellow)' }}
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[0.5, 1, 2, 5, 10].map(s => (
                  <button key={s} onClick={() => commit({ sim_speed_multiplier: s })} style={{
                    padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
                    fontFamily: 'var(--font-pixel)', fontSize: 9,
                    background: speed === s ? 'var(--accent-yellow)' : 'var(--bg-card)',
                    border: '1px solid var(--border)', color: speed === s ? '#000' : 'var(--text-primary)',
                  }}>{s}x</button>
                ))}
              </div>
            </div>
            {/* Unidad de tiempo */}
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--fs-xs)', color: 'var(--text-dim)', marginBottom: 6 }}>🕐 TIEMPO</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['sec','SEG'],['min','MIN'],['hr','HR']].map(([v,l]) => (
                  <button key={v} onClick={() => setTimeUnit(v)} style={{
                    padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                    fontFamily: 'var(--font-pixel)', fontSize: 9,
                    background: timeUnit === v ? 'var(--accent-blue)' : 'var(--bg-card)',
                    border: `1px solid ${timeUnit === v ? 'var(--accent-blue)' : 'var(--border)'}`,
                    color: timeUnit === v ? '#fff' : 'var(--text-dim)',
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sección MOSTRADOR ── */}
          <SectionHeader emoji="📋" title="MOSTRADOR" open={sections.mostrador} onToggle={() => toggle('mostrador')} />
          <SectionBody open={sections.mostrador}>
            <Slider label="Tomar pedido" value={cfg.manager_accept_time_seconds ?? 3} min={0} max={30} step={0.5} unit="s"
              hint="Tiempo del Manager en atender una llamada"
              onCommit={v => commit({ manager_accept_time_seconds: v })} />
            <Slider label="Entregar comanda" value={cfg.manager_comanda_time_seconds ?? 1} min={0} max={15} step={0.5} unit="s"
              hint="Tiempo de entregar comanda al chef"
              onCommit={v => commit({ manager_comanda_time_seconds: v })} />
            <Slider label="Cola comandas" value={cfg.comanda_queue_size ?? 3} min={1} max={10} step={1}
              hint="Máx. comandas en espera para el chef"
              onCommit={v => commit({ comanda_queue_size: v })} />
            <Slider label="Pizza gratis en" value={Math.round((cfg.free_delivery_after_minutes ?? 0.75) * 60)} min={10} max={300} step={5} unit="s"
              hint="Si el pedido tarda más → gratis"
              onCommit={v => commit({ free_delivery_after_minutes: v / 60 })} />
            <Slider label="Máx pizzas/pedido" value={cfg.max_pizzas_per_order ?? 5} min={1} max={10} step={1}
              hint="Límite de pizzas por orden"
              onCommit={v => commit({ max_pizzas_per_order: v })} />
          </SectionBody>

          {/* ── Sección COCINA ── */}
          <SectionHeader emoji="🍕" title="COCINA" open={sections.cocina} onToggle={() => toggle('cocina')} />
          <SectionBody open={sections.cocina}>
            <Slider label="Capacidad horno" value={cfg.oven_capacity ?? 4} min={1} max={8} step={1} unit=" 🍕"
              hint="Pedidos simultáneos en el horno"
              onCommit={v => commit({ oven_capacity: v })} />
            <Slider label="Horneado x pizza" value={cfg.cooking_time_sim_seconds ?? 10} min={1} max={60} step={1} unit="s"
              hint="Tiempo de cocción por pizza"
              onCommit={v => commit({ cooking_time_sim_seconds: v })} />
            <Slider label="Empacado x pizza" value={cfg.packing_time_per_pizza_seconds ?? 1} min={0} max={10} step={0.5} unit="s"
              hint="Tiempo de empaque por unidad"
              onCommit={v => commit({ packing_time_per_pizza_seconds: v })} />
            <Slider label="Reposo entregas" value={cfg.shelf_rest_seconds ?? 1} min={0} max={10} step={0.5} unit="s"
              hint="Tiempo mínimo en área de entregas"
              onCommit={v => commit({ shelf_rest_seconds: v })} />
            <Slider label="Limpiar c/ N pizzas" value={cfg.station_clean_every_n_pizzas ?? 50} min={1} max={100} step={1}
              hint="Cada N pizzas se limpia la cocina"
              onCommit={v => commit({ station_clean_every_n_pizzas: v })} />
            <Slider label="Tiempo limpieza" value={cfg.station_cleaning_time_seconds ?? 4} min={0} max={30} step={1} unit="s"
              hint="Duración de la limpieza"
              onCommit={v => commit({ station_cleaning_time_seconds: v })} />
          </SectionBody>

          {/* ── Sección ENTREGA ── */}
          <SectionHeader emoji="🛵" title="ENTREGA" open={sections.entrega} onToggle={() => toggle('entrega')} />
          <SectionBody open={sections.entrega}>
            <Slider label="Cap. delivery" value={cfg.max_delivery_capacity ?? 5} min={1} max={10} step={1} unit=" 🍕"
              hint="Máx. pizzas por viaje"
              onCommit={v => commit({ max_delivery_capacity: v })} />
            <Slider label="Máx pedidos/viaje" value={cfg.max_orders_per_delivery ?? 5} min={1} max={10} step={1}
              hint="Máx. pedidos distintos por viaje"
              onCommit={v => commit({ max_orders_per_delivery: v })} />
          </SectionBody>

        </div>
      )}
    </div>
  )
}
