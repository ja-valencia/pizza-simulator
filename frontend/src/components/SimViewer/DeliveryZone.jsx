import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '../../store/simStore'
import { DeliveryRobot } from './sprites/DeliveryRobot'
import { ClienteHouse } from './sprites/ClienteHouse'

const ROBOT_BOTTOM = 72
const FLOOR_HEIGHT = 52
const ROBOT_SIZE   = 68

export function DeliveryZone({ height = 340 }) {
  const agentActions   = useSimStore(s => s.agentActions.delivery)
  const agentStates    = useSimStore(s => s.agentStates.delivery)
  const deliveryHouses = useSimStore(s => s.deliveryHouses)

  const action    = agentActions.action
  const moving    = agentActions.moving
  const returning = agentActions.returning

  // Posición X del robot como % dentro de la zona (0 = izquierda, 75 = lejos a la derecha)
  const robotX = returning ? 2 : action === 'delivered' ? 70 : moving ? 55 : 2

  return (
    <div style={{
      flex: 1, height,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* === FONDO: Calle nocturna pixel art === */}
      {/* Cielo nocturno degradado */}
      <div style={{
        position: 'absolute', inset: 0, bottom: FLOOR_HEIGHT,
        background: 'linear-gradient(180deg, #050a14 0%, #0d1b2a 60%, #1a3045 100%)',
      }} />
      {/* Estrellas (puntos) */}
      {[...Array(18)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 3 === 0 ? 2 : 1,
          height: i % 3 === 0 ? 2 : 1,
          background: 'white',
          opacity: 0.4 + (i % 4) * 0.15,
          top: `${8 + (i * 13) % 55}%`,
          left: `${(i * 17 + 5) % 95}%`,
        }} />
      ))}
      {/* Edificios silueta pixel art */}
      <div style={{ position: 'absolute', bottom: FLOOR_HEIGHT, left: 0, right: 0 }}>
        {/* Edificio 1 */}
        <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 28, height: 80, background: '#0a1628' }}>
          <div style={{ position: 'absolute', top: 10, left: 4, width: 6, height: 6, background: '#fbbf2444' }} />
          <div style={{ position: 'absolute', top: 22, left: 14, width: 6, height: 6, background: '#fbbf2422' }} />
          <div style={{ position: 'absolute', top: 34, left: 4, width: 6, height: 6, background: '#4cc9f033' }} />
        </div>
        {/* Edificio 2 */}
        <div style={{ position: 'absolute', bottom: 0, left: '18%', width: 20, height: 55, background: '#0d1f35' }}>
          <div style={{ position: 'absolute', top: 8, left: 4, width: 5, height: 5, background: '#fbbf2433' }} />
        </div>
        {/* Edificio 3 */}
        <div style={{ position: 'absolute', bottom: 0, right: '8%', width: 32, height: 90, background: '#081422' }}>
          <div style={{ position: 'absolute', top: 12, left: 4, width: 7, height: 7, background: '#4cc9f044' }} />
          <div style={{ position: 'absolute', top: 28, left: 16, width: 7, height: 7, background: '#fbbf2433' }} />
        </div>
      </div>
      {/* Farola */}
      <div style={{ position: 'absolute', bottom: FLOOR_HEIGHT, left: '45%' }}>
        <div style={{ width: 3, height: 55, background: '#334155', marginLeft: 1 }} />
        <div style={{ width: 14, height: 3, background: '#334155', marginTop: -55, marginLeft: -5 }} />
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: '#fbbf24', marginTop: -13, marginLeft: -2,
          boxShadow: '0 0 12px 4px rgba(251,191,36,0.4)',
        }} />
      </div>

      {/* Zócalo */}
      <div style={{ position: 'absolute', bottom: FLOOR_HEIGHT, left: 0, right: 0, height: 5, background: '#1e3a5f' }} />
      {/* Piso asfalto con líneas */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: FLOOR_HEIGHT,
        background: '#0d1b2a',
        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.07) 28px, rgba(255,255,255,0.07) 30px)`,
      }} />
      {/* Línea central de la calle */}
      <div style={{
        position: 'absolute', bottom: FLOOR_HEIGHT - 20, left: 0, right: 0, height: 2,
        background: 'repeating-linear-gradient(90deg, #fbbf24 0, #fbbf24 14px, transparent 14px, transparent 28px)',
        opacity: 0.4,
      }} />

      {/* Label */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        color: '#4ade80', fontSize: '7px', letterSpacing: '1px', whiteSpace: 'nowrap',
        textShadow: '0 0 8px #4ade80',
      }}>
        ── ENTREGAS ──
      </div>

      {/* Casas de clientes */}
      <div style={{
        position: 'absolute',
        bottom: FLOOR_HEIGHT + 6,
        left: '28%', right: '2%',
        display: 'flex', alignItems: 'flex-end', gap: 10,
      }}>
        <AnimatePresence>
          {deliveryHouses.map(house => (
            <motion.div key={house.orderId}
              initial={{ opacity: 0, scale: 0, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ClienteHouse size={52} delivered={house.delivered} orderId={house.orderId} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* === ROBOT DELIVERY — alineado al mismo bottom === */}
      <motion.div
        animate={{ left: `${robotX}%` }}
        transition={{ duration: moving ? 1.8 : returning ? 2.2 : 0.3, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: ROBOT_BOTTOM,
          left: `${robotX}%`,
        }}
      >
        <DeliveryRobot size={ROBOT_SIZE} moving={moving} returning={returning} />
      </motion.div>

      {/* Flecha de dirección */}
      {moving && !returning && (
        <motion.div
          animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 0.7 }}
          style={{ position: 'absolute', bottom: ROBOT_BOTTOM + 20, left: '42%', color: '#4ade80', fontSize: 14 }}
        >►</motion.div>
      )}
      {returning && (
        <motion.div
          animate={{ x: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 0.7 }}
          style={{ position: 'absolute', bottom: ROBOT_BOTTOM + 20, left: '30%', color: '#fbbf24', fontSize: 14 }}
        >◄</motion.div>
      )}

      {agentStates.message && (
        <motion.div
          key={agentStates.message}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            position: 'absolute', bottom: 6, left: 4, right: 4,
            color: '#4ade80', fontSize: '6px', textAlign: 'center',
            fontStyle: 'italic', lineHeight: 1.5,
            background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: 2,
          }}
        >
          {agentStates.message.slice(0, 60)}
        </motion.div>
      )}
    </div>
  )
}
