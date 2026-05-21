import { motion } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { AgentSprite } from './AgentSprite'

// Zona Calle: el Delivery sale desde aquí a entregar.
// La animación de movimiento lateral indica si está en tránsito.
export function Street() {
  const delivery = useSimStore(s => s.agentStates.delivery)

  return (
    <div
      className="flex flex-col items-center justify-center gap-6 p-4 rounded-lg h-full"
      style={{ background: 'var(--bg-street)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>
        ── CALLE ──
      </div>

      {/* Flecha de ruta — visible solo cuando está en tránsito */}
      {delivery.inTransit && (
        <motion.div
          className="text-sm"
          animate={{ x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ color: 'var(--accent-green)' }}
        >
          ─────►
        </motion.div>
      )}

      <AgentSprite
        type="delivery"
        status={delivery.status}
        message={delivery.message}
        animKey={delivery.animKey}
        inTransit={delivery.inTransit}
      />

      {/* Cliente esperando en la calle */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-3xl">🏠</span>
        <span style={{ color: 'var(--text-dim)', fontSize: '9px' }}>destino</span>
      </div>
    </div>
  )
}
