import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useSimStore } from '../../store/simStore'

// ConfigPanel: editor live de SimConfig.
// Cada campo tiene label + descripción corta para que quede claro el impacto.
// onChange llama api.updateConfig() directamente — el backend persiste en Redis
// y hace broadcast CONFIG_UPDATED a todos los clientes WebSocket.

const FIELDS = [
  { key: 'sim_speed_multiplier',        label: 'Velocidad',           min: 0.5, max: 10,  step: 0.5, unit: 'x',   desc: 'Multiplica la velocidad del reloj' },
  { key: 'max_delivery_capacity',        label: 'Cap. Delivery',       min: 1,   max: 10,  step: 1,   unit: '🍕',  desc: 'Pizzas máx. por viaje' },
  { key: 'chef_batch_wait_seconds',      label: 'Espera Chef',         min: 0,   max: 120, step: 5,   unit: 's',   desc: 'Segundos acumulando pedidos' },
  { key: 'free_delivery_after_minutes',  label: 'SLA Entrega',         min: 1,   max: 120, step: 1,   unit: 'min', desc: 'Gratis si tarda más de X' },
  { key: 'station_clean_every_n_pizzas', label: 'Limpiar c/N pizzas',  min: 1,   max: 50,  step: 1,   unit: '🍕',  desc: 'Interrupciones del Chef' },
  { key: 'auto_order_interval_seconds',  label: 'Intervalo auto-pedido', min: 5, max: 60,  step: 5,   unit: 's',   desc: 'Segundos entre pedidos automáticos' },
]

function Slider({ fieldDef, value, onChange }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text-primary)', fontSize: '9px' }}>{fieldDef.label}</span>
        <span style={{ color: 'var(--accent-yellow)', fontSize: '9px', fontFamily: 'monospace' }}>
          {value}{fieldDef.unit}
        </span>
      </div>
      <input
        type="range"
        min={fieldDef.min}
        max={fieldDef.max}
        step={fieldDef.step}
        value={value}
        onChange={e => onChange(fieldDef.key, parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent-red)', cursor: 'pointer' }}
      />
      <div style={{ color: 'var(--text-dim)', fontSize: '8px' }}>{fieldDef.desc}</div>
    </div>
  )
}

export function ConfigPanel() {
  const storeConfig = useSimStore(s => s.config)
  const [localConfig, setLocalConfig] = useState(null)
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(false)

  // Inicializar con config del store (viene del WebSocket CONNECTED)
  useEffect(() => {
    if (storeConfig && !localConfig) {
      setLocalConfig(storeConfig)
      setAutoOrderEnabled(storeConfig.auto_order_enabled || false)
    }
  }, [storeConfig, localConfig])

  // Cargar config del backend si el store aún no tiene
  useEffect(() => {
    if (!storeConfig) {
      api.getConfig().then(cfg => {
        setLocalConfig(cfg)
        setAutoOrderEnabled(cfg.auto_order_enabled || false)
      }).catch(() => {})
    }
  }, [storeConfig])

  const handleChange = async (key, value) => {
    if (!localConfig) return
    const updated = { ...localConfig, [key]: value }
    setLocalConfig(updated)
    try {
      await api.updateConfig(updated)
    } catch (e) { console.error(e) }
  }

  const handleToggleAutoOrder = async () => {
    if (!localConfig) return
    const newVal = !autoOrderEnabled
    setAutoOrderEnabled(newVal)
    const updated = { ...localConfig, auto_order_enabled: newVal }
    setLocalConfig(updated)
    try {
      await api.updateConfig(updated)
    } catch (e) { console.error(e) }
  }

  if (!localConfig) {
    return <div style={{ color: 'var(--text-dim)', fontSize: '9px' }}>cargando config...</div>
  }

  return (
    <div>
      <div style={{ color: 'var(--text-dim)', fontSize: '8px', letterSpacing: '2px', marginBottom: '10px' }}>
        ── CONFIGURACIÓN ──
      </div>

      {FIELDS.filter(f => f.key !== 'auto_order_interval_seconds').map(field => (
        <Slider
          key={field.key}
          fieldDef={field}
          value={localConfig[field.key] ?? field.min}
          onChange={handleChange}
        />
      ))}

      {/* Auto-pedidos: toggle + intervalo */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: '9px' }}>Auto-pedidos</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '8px' }}>Genera pedidos automáticamente</div>
          </div>
          <button
            onClick={handleToggleAutoOrder}
            style={{
              background: autoOrderEnabled ? 'var(--accent-green)' : 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: autoOrderEnabled ? '#000' : 'var(--text-dim)',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '9px',
              fontFamily: 'inherit',
            }}
          >
            {autoOrderEnabled ? 'ON ✓' : 'OFF'}
          </button>
        </div>

        {autoOrderEnabled && (
          <Slider
            fieldDef={FIELDS.find(f => f.key === 'auto_order_interval_seconds')}
            value={localConfig.auto_order_interval_seconds ?? 10}
            onChange={handleChange}
          />
        )}
      </div>
    </div>
  )
}
