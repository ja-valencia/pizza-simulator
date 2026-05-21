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
      {/* ===== HORNO pixel art — reemplaza emoji ===== */}
      <motion.div
        animate={cooking
          ? { filter: ['drop-shadow(0 0 4px #f97316)', 'drop-shadow(0 0 20px #ef4444)', 'drop-shadow(0 0 4px #f97316)'] }
          : { filter: 'none' }}
        transition={{ repeat: Infinity, duration: 0.9 }}
        style={{ position: 'absolute', top: 28, right: 4 }}
      >
        <svg width="54" height="80" viewBox="0 0 54 80">
          {/* Panel superior de control */}
          <rect x="0"  y="0"  width="54" height="18" fill="#1a0a00" rx="2" />
          <rect x="1"  y="1"  width="52" height="16" fill="#2d1200" rx="2" />
          {/* Perillas */}
          <circle cx="11" cy="9" r="5" fill="#3d1a00" />
          <circle cx="11" cy="9" r="3" fill="#78350f" />
          <rect   x="9"  y="7" width="4" height="2" fill={cooking ? '#f97316' : '#1a0a00'} rx="1" />
          <circle cx="27" cy="9" r="5" fill="#3d1a00" />
          <circle cx="27" cy="9" r="3" fill="#78350f" />
          <circle cx="43" cy="9" r="5" fill="#3d1a00" />
          <circle cx="43" cy="9" r="3" fill={cooking ? '#ef4444' : '#78350f'} />
          {/* Luz indicadora */}
          <circle cx="43" cy="9" r="1.5" fill={cooking ? '#fbbf24' : '#3d1a00'} />

          {/* Cuerpo del horno */}
          <rect x="0" y="18" width="54" height="56" fill="#2d1200" />
          <rect x="1" y="19" width="52" height="54" fill="#1a0a00" />

          {/* Marco de la puerta */}
          <rect x="4"  y="22" width="46" height="42" fill="#3d1a00" rx="2" />
          {/* Puerta interior */}
          <rect x="5"  y="23" width="44" height="40" fill={cooking ? '#7c2d12' : '#0f0500'} rx="1" />
          {/* Ventana del horno */}
          <rect x="9"  y="27" width="36" height="26" fill={cooking ? '#92400e' : '#1c0800'} rx="2" />
          <rect x="10" y="28" width="34" height="24" fill={cooking ? '#f97316' : '#0f0500'} rx="1" opacity="0.85" />
          {cooking && <rect x="11" y="29" width="32" height="22" fill="#fbbf24" rx="1" opacity="0.35" />}
          {/* Reflejo en la ventana */}
          <rect x="12" y="30" width="8"  height="4"  fill="white" opacity={cooking ? 0.15 : 0.04} rx="1" />

          {/* Manija de la puerta */}
          <rect x="18" y="55" width="18" height="5" fill="#78350f" rx="2" />
          <rect x="22" y="56" width="10" height="3" fill="#92400e" rx="1" />

          {/* Base */}
          <rect x="0" y="74" width="54" height="6" fill="#1a0a00" />
          {/* Patas */}
          <rect x="4"  y="76" width="7" height="4" fill="#0f0500" rx="1" />
          <rect x="43" y="76" width="7" height="4" fill="#0f0500" rx="1" />
        </svg>
      </motion.div>

      {/* ===== BARRA DE ENTREGA — encimera donde el chef deja las pizzas empacadas ===== */}
      {/* Label de la barra */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 40, left: 4,
        color: '#fbbf24', fontSize: '6px', letterSpacing: '0.5px',
        opacity: 0.7, whiteSpace: 'nowrap',
      }}>
        LISTO ▶
      </div>
      {/* Superficie de la barra */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 6, left: 4, right: 4, height: 18,
        background: '#3d1a00', border: '1px solid #78350f', borderRadius: 2,
      }} />
      {/* Bordes de la barra (efecto 3D) */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 4, left: 4, right: 4, height: 4,
        background: '#1a0800', borderRadius: '0 0 2px 2px',
      }} />
      {/* Pizzas empacadas sobre la barra */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT + 26, left: 6, right: 6,
        display: 'flex', gap: 4, justifyContent: 'flex-start', flexWrap: 'wrap',
      }}>
        <AnimatePresence>
          {packed.map(o => (
            <motion.div key={o.id}
              initial={{ scale: 0, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400 }}
              style={{ fontSize: 15, lineHeight: 1 }}
              title={o.items?.join(', ')}
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
