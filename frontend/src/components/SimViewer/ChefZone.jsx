import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { ChefRobot } from './sprites/ChefRobot'

const ROBOT_BOTTOM = 72
const FLOOR_HEIGHT = 52
// Ancho del panel de entrega en el borde derecho (hacia DeliveryZone)
const SHELF_WIDTH = 48

export function ChefZone({ height = 340 }) {
  const agentActions = useSimStore(s => s.agentActions.chef)
  const agentStates  = useSimStore(s => s.agentStates.chef)
  const orders       = useSimStore(s => s.orders)

  const action  = agentActions.action
  const cooking = agentActions.cooking
  const packed  = orders.filter(o => o.status === 'PACKED').slice(0, 6)

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
      {/* === FONDO: pared de ladrillo === */}
      <div style={{
        position: 'absolute', inset: 0, bottom: FLOOR_HEIGHT,
        background: '#1a0a00',
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(120,53,15,0.4) 11px, rgba(120,53,15,0.4) 12px),
          repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(120,53,15,0.25) 19px, rgba(120,53,15,0.25) 20px)
        `,
      }} />
      {/* Efecto calor cuando cocina */}
      {cooking && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR_HEIGHT,
            background: 'radial-gradient(ellipse at 40% 60%, rgba(249,115,22,0.3) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Zócalo */}
      <div style={{ position: 'absolute', bottom: FLOOR_HEIGHT, left: 0, right: 0, height: 6, background: '#78350f' }} />
      {/* Piso */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: FLOOR_HEIGHT,
        background: '#1c1008',
        backgroundImage: `
          repeating-linear-gradient(90deg, rgba(120,53,15,0.4) 0, rgba(120,53,15,0.4) 1px, transparent 1px, transparent 18px),
          repeating-linear-gradient(0deg, rgba(120,53,15,0.4) 0, rgba(120,53,15,0.4) 1px, transparent 1px, transparent 18px)
        `,
      }} />
      {/* Label zona */}
      <div style={{
        position: 'absolute', top: 10, left: 8,
        color: '#fbbf24', fontSize: '7px', letterSpacing: '1px', whiteSpace: 'nowrap',
        textShadow: '0 0 8px #f97316',
      }}>
        ── COCINA ──
      </div>

      {/* ===== HORNO — en la pared de fondo, ancho, detrás del chef ===== */}
      {/* Se extiende desde la izquierda hasta donde empieza el panel de entrega */}
      <motion.div
        animate={cooking
          ? { filter: ['drop-shadow(0 0 6px #f97316)', 'drop-shadow(0 0 22px #ef4444)', 'drop-shadow(0 0 6px #f97316)'] }
          : { filter: 'none' }}
        transition={{ repeat: Infinity, duration: 0.9 }}
        style={{
          position: 'absolute',
          top: 28,
          left: 5,
          right: SHELF_WIDTH + 6,  // deja espacio para la barra de entrega
          height: 130,
        }}
      >
        {/* SVG con preserveAspectRatio="none" para estirarse al ancho disponible */}
        <svg width="100%" height="100%" viewBox="0 0 180 130" preserveAspectRatio="none"
          style={{ display: 'block' }}>

          {/* Panel de control superior */}
          <rect x="0" y="0"  width="180" height="22" fill="#1a0a00" />
          <rect x="1" y="1"  width="178" height="20" fill="#2d1200" />
          {/* 5 perillas */}
          {[18, 54, 90, 126, 162].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy="11" r="6"   fill="#3d1a00" />
              <circle cx={cx} cy="11" r="4"   fill="#78350f" />
              <circle cx={cx} cy="11" r="2"   fill={cooking ? (i === 4 ? '#fbbf24' : '#f97316') : '#3d1a00'} />
            </g>
          ))}
          {/* Luz indicadora derecha */}
          <rect x="168" y="6"  width="8" height="4"  fill={cooking ? '#4ade80' : '#1a0a00'} rx="1" />

          {/* Cuerpo del horno */}
          <rect x="0" y="22" width="180" height="108" fill="#2d1200" />
          <rect x="1" y="23" width="178" height="106" fill="#1a0a00" />

          {/* Tres puertas de horno (3 cámaras) */}
          {[4, 64, 124].map((x, i) => (
            <g key={i}>
              {/* Marco */}
              <rect x={x}   y="26" width="52" height="90" fill="#3d1a00" rx="2" />
              {/* Puerta */}
              <rect x={x+1} y="27" width="50" height="88" fill={cooking ? '#7c2d12' : '#0f0500'} rx="1" />
              {/* Ventana */}
              <rect x={x+4} y="30" width="44" height="52" fill={cooking ? '#92400e' : '#1c0800'} rx="2" />
              <rect x={x+5} y="31" width="42" height="50" fill={cooking ? '#f97316' : '#0f0500'} rx="1" opacity="0.85" />
              {cooking && <rect x={x+6} y="32" width="40" height="48" fill="#fbbf24" rx="1" opacity="0.3" />}
              {/* Reflejo vidrio */}
              <rect x={x+7} y="33" width="10" height="5"  fill="white" opacity={cooking ? 0.12 : 0.03} rx="1" />
              {/* Número de cámara */}
              <rect x={x+22} y="34" width="8" height="10" fill={cooking ? '#fbbf24' : '#3d1a00'} rx="1" opacity="0.6" />
              {/* Manija */}
              <rect x={x+12} y="86" width="28" height="6" fill="#78350f" rx="2" />
              <rect x={x+16} y="87" width="20" height="4" fill="#92400e" rx="1" />
            </g>
          ))}
        </svg>
      </motion.div>

      {/* Mostrador bajo el horno */}
      <div style={{
        position: 'absolute',
        bottom: FLOOR_HEIGHT + 6, left: 5, right: SHELF_WIDTH + 6, height: 16,
        background: '#3d1a00', border: '1px solid #78350f', borderRadius: 2,
      }} />

      {/* ===== BARRA DE ENTREGA — lado derecho, junto a DeliveryZone ===== */}
      <div style={{
        position: 'absolute',
        right: 0, top: 0, bottom: 0, width: SHELF_WIDTH,
        background: '#2a0e00',
        borderLeft: '3px solid #92400e',
      }}>
        {/* Label vertical */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          color: '#fbbf24', fontSize: '6px', letterSpacing: '0.8px',
          textShadow: '0 0 6px #f97316', whiteSpace: 'nowrap',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
        }}>
          ENTREGA ▼
        </div>
        {/* Estante superior */}
        <div style={{
          position: 'absolute', top: 80, left: 4, right: 4, height: 4,
          background: '#78350f', borderRadius: 2,
        }} />
        {/* Estante inferior (donde van las cajas) */}
        <div style={{
          position: 'absolute', bottom: FLOOR_HEIGHT + 22, left: 4, right: 4, height: 4,
          background: '#78350f', borderRadius: 2,
        }} />
        {/* Superficie del mostrador de entrega */}
        <div style={{
          position: 'absolute', bottom: FLOOR_HEIGHT + 6, left: 0, right: 0, height: 18,
          background: '#3d1a00', borderTop: '1px solid #92400e',
        }} />
        {/* Pizzas empacadas — se apilan desde abajo */}
        <div style={{
          position: 'absolute',
          bottom: FLOOR_HEIGHT + 26, left: 0, right: 0,
          display: 'flex', flexDirection: 'column-reverse',
          alignItems: 'center', gap: 2,
        }}>
          <AnimatePresence>
            {packed.map(o => (
              <motion.div key={o.id}
                initial={{ scale: 0, x: -20 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0, x: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                style={{ fontSize: 18, lineHeight: 1 }}
                title={o.items?.join(', ')}
              >📦</motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* Flecha indicando que Delivery toma de aquí */}
        <div style={{
          position: 'absolute', bottom: FLOOR_HEIGHT + 10, right: -1,
          color: '#fbbf24', fontSize: '10px', lineHeight: 1,
          textShadow: '0 0 6px #f97316',
        }}>▶</div>
      </div>

      {/* === ROBOT — centrado en el área de cocina (izquierda del shelf) === */}
      <motion.div
        key={agentActions.animKey}
        animate={robotAnim[action] || robotAnim.idle}
        style={{
          position: 'absolute', bottom: ROBOT_BOTTOM,
          // centra en el área del chef (excluyendo el shelf)
          left: `calc((100% - ${SHELF_WIDTH}px) / 2)`,
          transform: 'translateX(-50%)',
        }}
      >
        <ChefRobot size={72} action={action} cooking={cooking} />
      </motion.div>

      {agentStates.message && (
        <motion.div
          key={agentStates.message}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            position: 'absolute', bottom: 6, left: 4, right: SHELF_WIDTH + 4,
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
