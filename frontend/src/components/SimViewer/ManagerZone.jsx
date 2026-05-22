import { motion } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ManagerRobot } from './sprites/ManagerRobot'

const ROBOT_BOTTOM = 72
const FLOOR_HEIGHT = 52

// Event flashes: transformaciones visuales al recibir un evento.
// Separadas del idle-bob para que este último no se interrumpa.
const eventFlash = {
  order_created:  { scale: [1, 1.25, 0.95, 1] },
  order_accepted: { rotate: [-6, 6, -6, 0] },
  comanda_sent:   { x: [0, 22, 0] },
  comanda_read:   {},
  happy:          { scale: [1, 1.3, 0.9, 1] },
  shocked:        { x: [-12, 12, -12, 12, 0] },
}

// Icono de actividad en cada estación
function ActivityIcon({ action }) {
  if (action === 'order_created') return (
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ repeat: Infinity, duration: 0.7 }}
      style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
        fontSize: 16, marginBottom: 4, filter: 'drop-shadow(0 0 4px #4cc9f0)' }}>
      📞
    </motion.div>
  )
  if (action === 'comanda_sent') return (
    <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}
      style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
        fontSize: 16, marginBottom: 4 }}>
      📋
    </motion.div>
  )
  if (action === 'happy') return (
    <motion.div animate={{ rotate: [-10, 10, -10, 0] }} transition={{ duration: 0.5 }}
      style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
        fontSize: 16, marginBottom: 4 }}>
      💰
    </motion.div>
  )
  if (action === 'shocked') return (
    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
      fontSize: 16, marginBottom: 4 }}>
      🚨
    </div>
  )
  return null
}

export function ManagerZone({ height = 340 }) {
  const agentActions = useSimStore(s => s.agentActions.manager)
  const agentStates  = useSimStore(s => s.agentStates.manager)
  const action = agentActions.action
  const posX   = agentActions.posX ?? 50

  return (
    <div style={{
      width: '20%', minWidth: 120, height,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      borderRight: '2px solid #1e3a5f',
    }}>
      {/* === FONDO: Recepción === */}
      <div style={{
        position: 'absolute', inset: 0, bottom: FLOOR_HEIGHT,
        background: '#0f172a',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 13px, rgba(30,58,95,0.6) 13px, rgba(30,58,95,0.6) 14px),
          repeating-linear-gradient(90deg, transparent, transparent 25px, rgba(30,58,95,0.4) 25px, rgba(30,58,95,0.4) 26px)
        `,
      }} />
      <div style={{ position: 'absolute', bottom: FLOOR_HEIGHT, left: 0, right: 0, height: 6, background: '#1e3a5f' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: FLOOR_HEIGHT,
        background: '#0c1a2e',
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(30,58,95,0.5) 0, rgba(30,58,95,0.5) 1px, transparent 1px, transparent 20px),
          repeating-linear-gradient(0deg, rgba(30,58,95,0.5) 0, rgba(30,58,95,0.5) 1px, transparent 1px, transparent 20px)
        `,
      }} />
      {/* Letrero neón */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        color: '#4cc9f0', fontSize: '7px', letterSpacing: '1px', whiteSpace: 'nowrap',
        textShadow: '0 0 8px #4cc9f0, 0 0 16px #4cc9f0',
      }}>
        ── RECEPCIÓN ──
      </div>

      {/* Mesa con teléfono y caja registradora */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 6, left: 6, right: 6, height: 18,
        background: '#1e3a5f', border: '1px solid #2d5080', borderRadius: 2,
      }} />
      {/* Teléfono */}
      <svg style={{ position: 'absolute', bottom: FLOOR_HEIGHT + 25, left: 9 }}
           width="20" height="28" viewBox="0 0 20 28">
        <rect x="1" y="0" width="18" height="28" fill="#0f172a" rx="1" />
        <rect x="2" y="1" width="16" height="26" fill="#1e293b" rx="1" />
        <rect x="3" y="2" width="14" height="9"  fill="#0284c7" rx="1" />
        <rect x="4" y="3" width="12" height="7"  fill="#38bdf8" opacity="0.4" />
        <rect x="3"  y="14" width="4" height="2" fill="#334155" rx="1" />
        <rect x="8"  y="14" width="4" height="2" fill="#334155" rx="1" />
        <rect x="13" y="14" width="4" height="2" fill="#334155" rx="1" />
        <rect x="3"  y="18" width="4" height="2" fill="#334155" rx="1" />
        <rect x="8"  y="18" width="4" height="2" fill="#334155" rx="1" />
        <rect x="13" y="18" width="4" height="2" fill="#dc2626"  rx="1" />
        <rect x="3"  y="22" width="4" height="2" fill="#334155" rx="1" />
        <rect x="8"  y="22" width="4" height="2" fill="#334155" rx="1" />
        <rect x="13" y="22" width="4" height="2" fill="#334155" rx="1" />
      </svg>
      {/* Caja registradora */}
      <svg style={{ position: 'absolute', bottom: FLOOR_HEIGHT + 22, right: 7 }}
           width="38" height="36" viewBox="0 0 38 36">
        <rect x="16" y="0"  width="6" height="10" fill="#f1f5f9" rx="1" />
        <rect x="17" y="1"  width="4" height="8"  fill="#e2e8f0" />
        <rect x="0"  y="9"  width="38" height="26" fill="#1e3a5f" rx="1" />
        <rect x="1"  y="10" width="36" height="24" fill="#0f172a" rx="1" />
        <rect x="4"  y="12" width="30" height="10" fill="#0c4a6e" rx="1" />
        <rect x="5"  y="13" width="28" height="8"  fill="#0284c7" opacity="0.6" rx="1" />
        <rect x="6"  y="14" width="7"  height="5"  fill="#38bdf8" opacity="0.9" rx="1" />
        <rect x="15" y="14" width="7"  height="5"  fill="#38bdf8" opacity="0.5" rx="1" />
        <rect x="4"  y="24" width="9"  height="4" fill="#1e40af" rx="1" />
        <rect x="15" y="24" width="9"  height="4" fill="#1e40af" rx="1" />
        <rect x="26" y="24" width="8"  height="4" fill="#dc2626"  rx="1" />
        <rect x="2"  y="30" width="34" height="4" fill="#1e3a5f" rx="1" />
        <rect x="15" y="31" width="8"  height="2" fill="#2d5080" rx="1" />
      </svg>

      {/* === ROBOT: 3 capas ===
          Capa 1: posX — se mueve horizontalmente entre estaciones
          Capa 2: idle-bob — siempre activo, no se interrumpe
          Capa 3: event-flash — disparado por animKey en cada evento */}
      <motion.div
        animate={{ left: `${posX}%` }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: ROBOT_BOTTOM }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          style={{ display: 'inline-block', position: 'relative' }}
        >
          {/* Activity indicator encima del robot */}
          <ActivityIcon action={action} />

          <motion.div
            key={agentActions.animKey}
            animate={eventFlash[action] || {}}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <ManagerRobot
              size={68}
              action={action === 'shocked' ? 'shocked' : action === 'happy' ? 'happy' : action === 'order_created' ? 'calling' : 'idle'}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Mensaje del LLM */}
      {agentStates.message && (
        <motion.div
          key={agentStates.message}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            position: 'absolute', bottom: 6, left: 4, right: 4,
            color: '#4cc9f0', fontSize: '6px', textAlign: 'center',
            fontStyle: 'italic', lineHeight: 1.5,
            background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: 2,
          }}
        >
          {agentStates.message.slice(0, 50)}
        </motion.div>
      )}
    </div>
  )
}
