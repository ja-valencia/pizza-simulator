import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { AgentSprite } from './AgentSprite'

// Zona de Empaque: muestra pizzas listas esperando al delivery.
// El Manager también vive aquí (coordina entre cocina y delivery).
export function PackingZone() {
  const manager = useSimStore(s => s.agentStates.manager)
  const orders = useSimStore(s => s.orders)
  const packedOrders = orders.filter(o => ['PACKED', 'IN_DELIVERY'].includes(o.status))

  return (
    <div
      className="flex flex-col items-center justify-between gap-4 p-4 rounded-lg h-full"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>
        ── MANAGER / EMPAQUE ──
      </div>

      <AgentSprite
        type="manager"
        status={manager.status}
        message={manager.message}
        animKey={manager.animKey}
      />

      {/* Cajas de pizzas empacadas esperando delivery */}
      <div className="flex flex-wrap gap-2 justify-center min-h-12">
        <AnimatePresence>
          {packedOrders.map(order => (
            <motion.div
              key={order.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-2xl"
              title={`Pedido #${order.id.slice(0, 8)} — ${order.items?.join(', ')}`}
            >
              📦
            </motion.div>
          ))}
        </AnimatePresence>
        {packedOrders.length === 0 && (
          <span style={{ color: 'var(--text-dim)', fontSize: '9px' }}>sin pedidos listos</span>
        )}
      </div>
    </div>
  )
}
