import { motion } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ManagerRobot } from './sprites/ManagerRobot'

// ManagerZone — 20% del pipeline. El Manager recibe pedidos y coordina.
// Animaciones: parpadeo de pantalla en ORDER_CREATED, levantar clipboard en COMANDA_SENT.
export function ManagerZone() {
  const agentActions = useSimStore(s => s.agentActions.manager)
  const agentStates  = useSimStore(s => s.agentStates.manager)

  const action = agentActions.action

  // Variantes de animación por acción del Manager
  const robotVariants = {
    idle:          { y: [0, -3, 0], transition: { repeat: Infinity, duration: 2.5 } },
    order_created: { scale: [1, 1.08, 1], transition: { duration: 0.3 } },
    order_accepted:{ rotate: [-2, 2, -2, 0], transition: { duration: 0.4 } },
    comanda_sent:  { x: [0, 8, 0], transition: { duration: 0.5 } },
    happy:         { y: [0, -10, 0], transition: { duration: 0.4 } },
    shocked:       { x: [-6, 6, -6, 6, 0], transition: { duration: 0.5 } },
  }

  const currentVariant = robotVariants[action] || robotVariants.idle

  return (
    <div style={{
      width: '20%',
      minWidth: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '12px 8px 8px',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)',
      borderRight: '2px solid var(--border)',
      borderRadius: '8px 0 0 8px',
      position: 'relative',
      minHeight: '260px',
    }}>
      {/* Label de zona */}
      <div style={{
        position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
        color: '#4cc9f0', fontSize: '7px', letterSpacing: '2px', whiteSpace: 'nowrap',
      }}>
        ── MANAGER ──
      </div>

      {/* Teléfono / icono de pedido entrante */}
      <motion.div
        animate={action === 'order_created' ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 0.6 }}
        style={{ fontSize: '18px', marginBottom: '4px' }}
      >
        {action === 'order_created' || action === 'order_accepted' ? '📱' : '📋'}
      </motion.div>

      {/* Robot Manager */}
      <motion.div
        key={agentActions.animKey}
        animate={currentVariant}
        style={{ marginBottom: '8px' }}
      >
        <ManagerRobot
          size={70}
          action={action === 'shocked' ? 'shocked' : action === 'happy' ? 'happy' : action === 'order_created' ? 'calling' : 'idle'}
        />
      </motion.div>

      {/* Mensaje del LLM */}
      {agentStates.message && (
        <motion.div
          key={agentStates.message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: '#64748b', fontSize: '7px', textAlign: 'center',
            fontStyle: 'italic', maxWidth: '100px', lineHeight: '1.4',
          }}
        >
          "{agentStates.message.slice(0, 40)}..."
        </motion.div>
      )}
    </div>
  )
}
