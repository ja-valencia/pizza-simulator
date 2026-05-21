import { motion } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ManagerRobot } from './sprites/ManagerRobot'

// Posición vertical del robot — igual en las 3 zonas para alineación perfecta
const ROBOT_BOTTOM = 72
const FLOOR_HEIGHT = 52

export function ManagerZone({ height = 340 }) {
  const agentActions = useSimStore(s => s.agentActions.manager)
  const agentStates  = useSimStore(s => s.agentStates.manager)
  const action = agentActions.action

  const robotAnim = {
    idle:           { y: [0, -4, 0], transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' } },
    order_created:  { scale: [1, 1.1, 1], transition: { duration: 0.35 } },
    order_accepted: { rotate: [-3, 3, -3, 0], transition: { duration: 0.4 } },
    comanda_sent:   { x: [0, 10, 0], transition: { duration: 0.5 } },
    happy:          { y: [0, -12, 0], transition: { duration: 0.45 } },
    shocked:        { x: [-7, 7, -7, 7, 0], transition: { duration: 0.5 } },
  }

  return (
    <div style={{
      width: '20%', minWidth: 120, height,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      borderRight: '2px solid #1e3a5f',
    }}>
      {/* === FONDO: Recepción / Interior === */}
      {/* Pared con ladrillos pixelados */}
      <div style={{
        position: 'absolute', inset: 0, bottom: FLOOR_HEIGHT,
        background: '#0f172a',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 13px, rgba(30,58,95,0.6) 13px, rgba(30,58,95,0.6) 14px),
          repeating-linear-gradient(90deg, transparent, transparent 25px, rgba(30,58,95,0.4) 25px, rgba(30,58,95,0.4) 26px)
        `,
      }} />
      {/* Zócalo */}
      <div style={{ position: 'absolute', bottom: FLOOR_HEIGHT, left: 0, right: 0, height: 6, background: '#1e3a5f' }} />
      {/* Piso tipo baldosa */}
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
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        color: '#4cc9f0', fontSize: '7px', letterSpacing: '1px', whiteSpace: 'nowrap',
        textShadow: '0 0 8px #4cc9f0, 0 0 16px #4cc9f0',
      }}>
        ── RECEPCIÓN ──
      </div>
      {/* Mostrador */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 6, left: 6, right: 6, height: 18,
        background: '#1e3a5f', border: '1px solid #2d5080', borderRadius: 2,
      }} />

      {/* === ROBOT — mismo bottom en todas las zonas === */}
      <motion.div
        key={agentActions.animKey}
        animate={robotAnim[action] || robotAnim.idle}
        style={{
          position: 'absolute', bottom: ROBOT_BOTTOM,
          left: '50%', transform: 'translateX(-50%)',
        }}
      >
        <ManagerRobot
          size={68}
          action={action === 'shocked' ? 'shocked' : action === 'happy' ? 'happy' : action === 'order_created' ? 'calling' : 'idle'}
        />
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
