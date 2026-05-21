import { useState } from 'react'
import { api } from '../services/api'
import { useSimStore } from '../store/simStore'

const PIZZA_MENU = ['margarita', 'pepperoni', 'hawaiana', 'cuatro quesos', 'vegetariana', 'bbq pollo']
const SPEEDS = [0.5, 1, 2, 5]

// SimControls: panel de control de la simulación.
// - ▶/⏹/↺ controlan el reloj del backend
// - Velocidad: PUT /config con sim_speed_multiplier
// - "+ Pedido": crea un pedido manual via POST /orders
export function SimControls() {
  const { isRunning, speed } = useSimStore()
  const [selectedItems, setSelectedItems] = useState([])
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStart = async () => { try { await api.simStart() } catch(e) { console.error(e) } }
  const handleStop  = async () => { try { await api.simStop()  } catch(e) { console.error(e) } }
  const handleReset = async () => { try { await api.simReset() } catch(e) { console.error(e) } }

  const handleSpeedChange = async (s) => {
    try {
      const cfg = await api.getConfig()
      await api.updateConfig({ ...cfg, sim_speed_multiplier: s })
    } catch(e) { console.error(e) }
  }

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) return
    setLoading(true)
    try {
      await api.createOrder(selectedItems)
      setSelectedItems([])
      setShowOrderModal(false)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggleItem = (item) => setSelectedItems(prev =>
    prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
  )

  const btnStyle = (active) => ({
    background: active ? 'var(--accent-red)' : 'var(--bg-kitchen)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '10px',
    fontFamily: 'inherit',
  })

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Controles de reloj */}
      <div className="flex gap-1">
        <button style={btnStyle(!isRunning)} onClick={handleStart} disabled={isRunning}>▶ START</button>
        <button style={btnStyle(isRunning)}  onClick={handleStop}  disabled={!isRunning}>⏹ STOP</button>
        <button style={btnStyle(false)}       onClick={handleReset} disabled={isRunning}>↺ RESET</button>
      </div>

      {/* Velocidad */}
      <div className="flex gap-1 items-center">
        <span style={{ color: 'var(--text-dim)', fontSize: '9px' }}>SPEED:</span>
        {SPEEDS.map(s => (
          <button
            key={s}
            style={{ ...btnStyle(speed === s), background: speed === s ? 'var(--accent-yellow)' : 'var(--bg-kitchen)', color: speed === s ? '#000' : 'var(--text-primary)' }}
            onClick={() => handleSpeedChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Crear pedido manual */}
      <button
        style={{ ...btnStyle(false), background: 'var(--accent-green)', color: '#000' }}
        onClick={() => setShowOrderModal(true)}
      >
        + PEDIDO
      </button>

      {/* Modal de pedido */}
      {showOrderModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', borderRadius: '8px', minWidth: '280px' }}>
            <div className="text-sm mb-4" style={{ color: 'var(--accent-blue)' }}>NUEVO PEDIDO</div>
            <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {PIZZA_MENU.map(item => (
                <button
                  key={item}
                  onClick={() => toggleItem(item)}
                  style={{
                    ...btnStyle(selectedItems.includes(item)),
                    background: selectedItems.includes(item) ? 'var(--accent-red)' : 'var(--bg-kitchen)',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                style={{ ...btnStyle(false), background: 'var(--accent-green)', color: '#000', flex: 1 }}
                onClick={handleCreateOrder}
                disabled={loading || selectedItems.length === 0}
              >
                {loading ? '...' : `ORDENAR (${selectedItems.length})`}
              </button>
              <button style={btnStyle(false)} onClick={() => setShowOrderModal(false)}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
