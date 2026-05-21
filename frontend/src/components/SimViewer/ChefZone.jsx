import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ChefRobot } from './sprites/ChefRobot'

// ChefZone — 30% del pipeline. Chef hornea, verifica limpieza y empaca.
export function ChefZone() {
  const agentActions = useSimStore(s => s.agentActions.chef)
  const agentStates  = useSimStore(s => s.agentStates.chef)
  const orders       = useSimStore(s => s.orders)

  const action  = agentActions.action
  const cooking = agentActions.cooking

  const packedOrders = orders.filter(o => o.status === 'PACKED').slice(0, 4)

  const robotVariants = {
    idle:     { y: [0, -3, 0], transition: { repeat: Infinity, duration: 2.5 } },
    cooking:  { x: [-4, 4, -4, 0], transition: { repeat: 3, duration: 0.3 } },
    baked:    { y: [0, -14, 0], transition: { duration: 0.5 } },
    packed:   { x: [0, 10, 0], transition: { duration: 0.6 } },
    cleaning: { rotate: [-8, 8, -8, 8, 0], transition: { duration: 0.6 } },
  }

  return (
    <div style={{
      width: '30%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '12px 8px 8px',
      background: 'linear-gradient(180deg, #1a0a00 0%, #3d1a00 100%)',
      borderRight: '2px solid var(--border)',
      position: 'relative',
      minHeight: '260px',
    }}>
      <div style={{
        position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
        color: '#fbbf24', fontSize: '7px', letterSpacing: '2px', whiteSpace: 'nowrap',
      }}>
        ── COCINA / EMPAQUE ──
      </div>

      {/* Horno */}
      <motion.div
        animate={cooking
          ? { filter: ['drop-shadow(0 0 4px #f97316)', 'drop-shadow(0 0 18px #ef4444)', 'drop-shadow(0 0 4px #f97316)'] }
          : { filter: 'none' }
        }
        transition={{ repeat: Infinity, duration: 0.8 }}
        style={{ fontSize: '28px', marginBottom: '4px' }}
      >
        🔥
      </motion.div>

      {/* Robot Chef */}
      <motion.div
        key={agentActions.animKey}
        animate={robotVariants[action] || robotVariants.idle}
        style={{ marginBottom: '8px' }}
      >
        <ChefRobot size={75} action={action} cooking={cooking} />
      </motion.div>

      {/* Pizzas empacadas esperando delivery */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', minHeight: '24px' }}>
        <AnimatePresence>
          {packedOrders.map(o => (
            <motion.div
              key={o.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{ fontSize: '16px' }}
              title={o.items?.join(', ')}
            >
              📦
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Estado del agente */}
      <div style={{ color: '#78350f', fontSize: '8px', textAlign: 'center', marginTop: '4px' }}>
        {agentStates.status || 'idle'}
      </div>
    </div>
  )
}
