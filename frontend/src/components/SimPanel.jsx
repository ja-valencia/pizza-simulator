import { useState } from 'react'
import { useSimStore } from '../store/simStore'
import { api } from '../services/api'

// SimPanel — panel de control inline debajo del SimViewer.
// 3 tabs: VELOCIDAD (slider speed), REGLAS (config de producción), TIEMPO (unidad del reloj).
// Todos los cambios persisten al backend via PUT /config.

function SliderRow({ label, value, min, max, step, unit, onChange, onCommit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ width: 120, fontSize: '8px', color: 'var(--text-dim)', flexShrink: 0 }}>
        {label}
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        onMouseUp={onCommit} onTouchEnd={onCommit}
        style={{ flex: 1, accentColor: 'var(--accent-yellow)', cursor: 'pointer' }}
      />
      <div style={{
        minWidth: 38, textAlign: 'right', fontSize: '9px', fontWeight: 'bold',
        color: 'var(--accent-yellow)',
      }}>
        {value}{unit || ''}
      </div>
    </div>
  )
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <div style={{ flex: 1, fontSize: '8px', color: 'var(--text-dim)' }}>{label}</div>
      <button
        onClick={() => onChange(!value)}
        style={{
          padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '8px',
          background: value ? 'var(--accent-green)' : 'var(--bg-kitchen)',
          border: `1px solid ${value ? 'var(--accent-green)' : 'var(--border)'}`,
          color: value ? '#000' : 'var(--text-dim)',
        }}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  )
}

function PillToggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map(o => (
        <button key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '8px',
            background: value === o.value ? 'var(--accent-blue)' : 'var(--bg-kitchen)',
            border: `1px solid ${value === o.value ? 'var(--accent-blue)' : 'var(--border)'}`,
            color: value === o.value ? '#fff' : 'var(--text-dim)',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const TABS = ['VELOCIDAD', 'REGLAS', 'TIEMPO']

export function SimPanel() {
  const [open, setOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('VELOCIDAD')
  const config    = useSimStore(s => s.config)
  const timeUnit  = useSimStore(s => s.timeUnit)
  const setTimeUnit = useSimStore(s => s.setTimeUnit)

  // Local slider state (sin debounce, solo commit al soltar)
  const [localSpeed, setLocalSpeed] = useState(null)

  const cfg = config || {}

  // Commit: envía al backend y deja que CONFIG_UPDATED sincronice el store
  const commit = async (patch) => {
    try { await api.updateConfig({ ...cfg, ...patch }) }
    catch (e) { console.error('[SimPanel] updateConfig error:', e) }
  }

  const speedVal = localSpeed ?? cfg.sim_speed_multiplier ?? 1

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 6, marginBottom: 12, overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '8px 14px', background: 'transparent',
          border: 'none', borderBottom: open ? '1px solid var(--border)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '1px', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '10px' }}>{open ? '▼' : '▶'}</span>
        <span>PANEL DE CONTROL</span>
        {/* Tabs en el header cuando está abierto */}
        {open && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {TABS.map(t => (
              <button key={t}
                onClick={e => { e.stopPropagation(); setActiveTab(t) }}
                style={{
                  padding: '2px 10px', borderRadius: 3, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '7px',
                  background: activeTab === t ? 'var(--accent-red)' : 'transparent',
                  border: `1px solid ${activeTab === t ? 'var(--accent-red)' : 'var(--border)'}`,
                  color: activeTab === t ? '#fff' : 'var(--text-dim)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: '12px 16px' }}>

          {/* ── Tab VELOCIDAD ── */}
          {activeTab === 'VELOCIDAD' && (
            <div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: 10 }}>
                Ajusta la velocidad de la simulación. Los agentes LLM responden más rápido
                pero las llamadas a la API pueden saturarse con velocidades muy altas.
              </div>
              <SliderRow
                label="Velocidad"
                value={speedVal}
                min={0.5} max={10} step={0.5} unit="x"
                onChange={setLocalSpeed}
                onCommit={() => {
                  commit({ sim_speed_multiplier: speedVal })
                  setLocalSpeed(null)
                }}
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {[0.5, 1, 2, 5, 10].map(s => (
                  <button key={s}
                    onClick={() => { commit({ sim_speed_multiplier: s }) }}
                    style={{
                      padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '8px',
                      background: speedVal === s ? 'var(--accent-yellow)' : 'var(--bg-kitchen)',
                      border: '1px solid var(--border)',
                      color: speedVal === s ? '#000' : 'var(--text-primary)',
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab REGLAS ── */}
          {activeTab === 'REGLAS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <SliderRow label="Capacidad horno" value={cfg.oven_capacity ?? 3}
                min={1} max={6} step={1} unit=" pizzas"
                onChange={() => {}} onCommit={e => commit({ oven_capacity: Number(e.target.value) })} />
              <SliderRow label="Pizzas por viaje" value={cfg.max_delivery_capacity ?? 5}
                min={1} max={10} step={1} unit=" pzz"
                onChange={() => {}} onCommit={e => commit({ max_delivery_capacity: Number(e.target.value) })} />
              <SliderRow label="SLA entrega (min)" value={cfg.free_delivery_after_minutes ?? 45}
                min={5} max={120} step={5} unit="m"
                onChange={() => {}} onCommit={e => commit({ free_delivery_after_minutes: Number(e.target.value) })} />
              <SliderRow label="Limpiar cada N pzz" value={cfg.station_clean_every_n_pizzas ?? 10}
                min={1} max={50} step={1} unit=""
                onChange={() => {}} onCommit={e => commit({ station_clean_every_n_pizzas: Number(e.target.value) })} />
              <SliderRow label="Cola comandas" value={cfg.comanda_queue_size ?? 5}
                min={1} max={10} step={1} unit=""
                onChange={() => {}} onCommit={e => commit({ comanda_queue_size: Number(e.target.value) })} />
              <SliderRow label="Espera chef (s)" value={cfg.chef_batch_wait_seconds ?? 30}
                min={0} max={120} step={5} unit="s"
                onChange={() => {}} onCommit={e => commit({ chef_batch_wait_seconds: Number(e.target.value) })} />
              <SliderRow label="Tiempo cocción (s)" value={cfg.cooking_time_sim_seconds ?? 30}
                min={5} max={180} step={5} unit="s"
                onChange={() => {}} onCommit={e => commit({ cooking_time_sim_seconds: Number(e.target.value) })} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ToggleRow label="Auto-pedidos"
                  value={cfg.auto_order_enabled ?? false}
                  onChange={v => commit({ auto_order_enabled: v })} />
                {cfg.auto_order_enabled && (
                  <SliderRow label="Intervalo auto (s)" value={cfg.auto_order_interval_seconds ?? 10}
                    min={5} max={60} step={5} unit="s"
                    onChange={() => {}} onCommit={e => commit({ auto_order_interval_seconds: Number(e.target.value) })} />
                )}
              </div>
            </div>
          )}

          {/* ── Tab TIEMPO ── */}
          {activeTab === 'TIEMPO' && (
            <div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginBottom: 12 }}>
                Unidad de tiempo del reloj de simulación.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <PillToggle
                  options={[
                    { value: 'sec', label: 'SEG' },
                    { value: 'min', label: 'MIN' },
                    { value: 'hr',  label: 'HR' },
                  ]}
                  value={timeUnit}
                  onChange={setTimeUnit}
                />
                <div style={{ fontSize: '8px', color: 'var(--text-dim)' }}>
                  Formato:&nbsp;
                  <span style={{ color: 'var(--accent-blue)' }}>
                    {timeUnit === 'sec' ? '01:23' : timeUnit === 'min' ? '1m 23s' : '0h 01m'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
