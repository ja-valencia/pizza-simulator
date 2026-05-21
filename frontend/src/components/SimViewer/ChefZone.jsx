import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ChefRobot } from './sprites/ChefRobot'

const ROBOT_BOTTOM = 72
const FLOOR_HEIGHT = 52

export function ChefZone({ height = 340 }) {
  const agentActions = useSimStore(s => s.agentActions.chef)
  const agentStates  = useSimStore(s => s.agentStates.chef)
  const orders       = useSimStore(s => s.orders)

  const action  = agentActions.action
  const cooking = agentActions.cooking
  const packed  = orders.filter(o => o.status === 'PACKED').slice(0, 4)

  const robotAnim = {
    idle:     { y: [0, -4, 0], transition: { repeat: Infinity, duration: 2.8, ease: 'easeInOut' } },
    cooking:  { x: [-3, 3, -3, 0], transition: { repeat: 2, duration: 0.3 } },
    baked:    { y: [0, -14, 0], transition: { duration: 0.5 } },
    packed:   { x: [0, 12, 0], transition: { duration: 0.6 } },
    cleaning: { rotate: [-8, 8, -8, 8, 0], transition: { duration: 0.6 } },
  }

  return (
    <div style={{
      width: '30%', height,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      borderRight: '2px solid #3d1a00',
    }}>
      {/* === FONDO: Cocina con ladrillo y calor === */}
      {/* Pared: ladrillo */}
      <div style={{
        position: 'absolute', inset: 0, bottom: FLOOR_HEIGHT,
        background: '#1a0a00',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(120,53,15,0.4) 11px, rgba(120,53,15,0.4) 12px),
          repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(120,53,15,0.25) 19px, rgba(120,53,15,0.25) 20px)
        `,
      }} />
      {/* Efecto de calor/glow cuando cocina */}
      {cooking && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR_HEIGHT,
            background: 'radial-gradient(ellipse at 50% 70%, rgba(249,115,22,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Zócalo */}
      <div style={{ position: 'absolute', bottom: FLOOR_HEIGHT, left: 0, right: 0, height: 6, background: '#78350f' }} />
      {/* Piso cocina: azulejos blancos */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: FLOOR_HEIGHT,
        background: '#1c1008',
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(120,53,15,0.4) 0, rgba(120,53,15,0.4) 1px, transparent 1px, transparent 18px),
          repeating-linear-gradient(0deg, rgba(120,53,15,0.4) 0, rgba(120,53,15,0.4) 1px, transparent 1px, transparent 18px)
        `,
      }} />
      {/* Label */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        color: '#fbbf24', fontSize: '7px', letterSpacing: '1px', whiteSpace: 'nowrap',
        textShadow: '0 0 8px #f97316',
      }}>
        ── COCINA ──
      </div>
      {/* Horno pixel art */}
      <motion.div
        animate={cooking
          ? { filter: ['drop-shadow(0 0 4px #f97316)', 'drop-shadow(0 0 16px #ef4444)', 'drop-shadow(0 0 4px #f97316)'] }
          : {}}
        transition={{ repeat: Infinity, duration: 0.9 }}
        style={{
          position: 'absolute', top: 32, right: 8,
          fontSize: '28px', lineHeight: 1,
        }}
      >
        🔥
      </motion.div>
      {/* Encimera */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 6, left: 6, right: 6, height: 16,
        background: '#3d1a00', border: '1px solid #78350f', borderRadius: 2,
      }} />
      {/* Pizzas empacadas en la encimera */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 24, left: 8, right: 8,
        display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap',
      }}>
        <AnimatePresence>
          {packed.map(o => (
            <motion.div key={o.id}
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{ fontSize: 14 }} title={o.items?.join(', ')}
            >📦</motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* === ROBOT — mismo bottom === */}
      <motion.div
        key={agentActions.animKey}
        animate={robotAnim[action] || robotAnim.idle}
        style={{
          position: 'absolute', bottom: ROBOT_BOTTOM,
          left: '50%', transform: 'translateX(-50%)',
        }}
      >
        <ChefRobot size={72} action={action} cooking={cooking} />
      </motion.div>

      {agentStates.message && (
        <motion.div
          key={agentStates.message}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            position: 'absolute', bottom: 6, left: 4, right: 4,
            color: '#fbbf24', fontSize: '6px', textAlign: 'center',
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
